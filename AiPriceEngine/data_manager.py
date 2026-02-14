"""
data_manager.py — AgroStack Data Preprocessing Pipeline
========================================================
Handles CSV ingestion (Agmarknet / Data.gov.in format), synthetic demo-data
generation, **live Kerala mandi price fetching**, Min-Max scaling, and
sliding-window sequence creation for the LSTM shock model.
"""

from __future__ import annotations

import datetime as dt
import logging
import os
from typing import Any, Dict, List, Tuple, Optional

import httpx

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler as _SklearnMinMaxScaler


# 1. CSV Loader — Agmarknet / Data.gov.in Format

def load_csv(path: str, date_col: str = "Arrival_Date", price_col: str = "Modal_Price") -> pd.DataFrame:
    """Load a market-price CSV and return a clean DataFrame.

    The output always contains two columns:
      • ``ds`` — datetime (Prophet convention)
      • ``y``  — modal price as float

    Parameters
    ----------
    path : str
        Absolute or relative path to the CSV file.
    date_col : str
        Name of the column holding dates in the raw CSV.
    price_col : str
        Name of the column holding the target price in the raw CSV.

    Returns
    -------
    pd.DataFrame
        Sorted DataFrame with columns ``['ds', 'y']``.
    """
    df = pd.read_csv(path)

    # Normalise column names (strip whitespace, lowercase for matching)
    df.columns = df.columns.str.strip()

    if date_col not in df.columns:
        raise KeyError(f"Date column '{date_col}' not found. Available: {list(df.columns)}")
    if price_col not in df.columns:
        raise KeyError(f"Price column '{price_col}' not found. Available: {list(df.columns)}")

    out = pd.DataFrame()
    out["ds"] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
    out["y"] = pd.to_numeric(df[price_col], errors="coerce")

    # Drop rows where parsing failed
    out.dropna(subset=["ds", "y"], inplace=True)
    out.sort_values("ds", inplace=True)
    out.reset_index(drop=True, inplace=True)

    return out


# 2. Synthetic Data Generator (Demo Purposes)

def generate_synthetic_data(
    days: int = 365 * 3,
    start_date: str = "2022-01-01",
    seed: int = 42,
) -> pd.DataFrame:
    """Create realistic synthetic market data for demo & testing.

    Generates three correlated columns:
      • **Price**    — base trend + 12-month seasonality + random noise
      • **Rainfall** — seasonal pattern peaking during monsoon months
      • **Demand**   — positively correlated with price (with lag & jitter)

    Parameters
    ----------
    days : int
        Number of daily data-points to generate (default: 3 years).
    start_date : str
        ISO date string for the first record.
    seed : int
        Numpy random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        Columns: ``['ds', 'y', 'rainfall', 'demand']``
    """
    rng = np.random.default_rng(seed)
    dates = pd.date_range(start=start_date, periods=days, freq="D")

    # --- Price (₹/quintal style) ---
    base_price = 2500.0
    trend = np.linspace(0, 400, days)  # slow upward drift
    seasonality = 300 * np.sin(2 * np.pi * np.arange(days) / 365.25)  # yearly cycle
    noise = rng.normal(0, 80, days)
    price = base_price + trend + seasonality + noise
    price = np.clip(price, 500, None)  # prices can't go negative / too low

    # --- Rainfall (mm) — peaks Jun-Sep ---
    day_of_year = dates.dayofyear
    rainfall_season = 120 * np.exp(-0.5 * ((day_of_year - 200) / 40) ** 2)
    rainfall = rainfall_season + rng.exponential(5, days)
    rainfall = np.clip(rainfall, 0, None)

    # --- Demand (index 0-100) — loosely follows price ---
    demand = 50 + 20 * np.sin(2 * np.pi * np.arange(days) / 365.25 + 0.5)
    demand += rng.normal(0, 5, days)
    demand = np.clip(demand, 0, 100)

    return pd.DataFrame({
        "ds": dates,
        "y": np.round(price, 2),
        "rainfall": np.round(rainfall, 2),
        "demand": np.round(demand, 2),
    })


# 3. Min-Max Scaler Wrapper

class PriceScaler:
    """Thin wrapper around sklearn's MinMaxScaler for AgroStack conventions.

    Provides ``fit_transform`` / ``inverse_transform`` with consistent 2-D
    reshaping so callers can pass 1-D price arrays directly.
    """

    def __init__(self, feature_range: Tuple[float, float] = (0.0, 1.0)):
        self._scaler = _SklearnMinMaxScaler(feature_range=feature_range)
        self._is_fitted = False

    def fit_transform(self, data: np.ndarray) -> np.ndarray:
        """Fit on *data* and return scaled values (shape preserved)."""
        original_shape = data.shape
        flat = data.reshape(-1, 1) if data.ndim == 1 else data
        scaled = self._scaler.fit_transform(flat)
        self._is_fitted = True
        return scaled.reshape(original_shape)

    def transform(self, data: np.ndarray) -> np.ndarray:
        """Scale *data* using previously fitted parameters."""
        if not self._is_fitted:
            raise RuntimeError("Scaler has not been fitted yet. Call fit_transform first.")
        original_shape = data.shape
        flat = data.reshape(-1, 1) if data.ndim == 1 else data
        return self._scaler.transform(flat).reshape(original_shape)

    def inverse_transform(self, data: np.ndarray) -> np.ndarray:
        """Map scaled values back to the original price range."""
        if not self._is_fitted:
            raise RuntimeError("Scaler has not been fitted yet. Call fit_transform first.")
        original_shape = data.shape
        flat = data.reshape(-1, 1) if data.ndim == 1 else data
        return self._scaler.inverse_transform(flat).reshape(original_shape)


# 4. Sliding-Window Sequence Builder (LSTM)

def create_sequences(
    data: np.ndarray,
    window: int = 30,
) -> Tuple[np.ndarray, np.ndarray]:
    """Build overlapping (X, y) pairs for supervised time-series learning.

    For an input array of length *N*, this produces:
      • ``X`` — shape ``(N - window, window, 1)``
      • ``y`` — shape ``(N - window,)``

    Parameters
    ----------
    data : np.ndarray
        1-D array of scaled prices.
    window : int
        Look-back window size (default 30 days).

    Returns
    -------
    Tuple[np.ndarray, np.ndarray]
        ``(X, y)`` ready for ``model.fit()``.
    """
    if len(data) <= window:
        raise ValueError(
            f"Data length ({len(data)}) must exceed window size ({window})."
        )

    X, y = [], []
    for i in range(window, len(data)):
        X.append(data[i - window : i])
        y.append(data[i])

    X = np.array(X).reshape(-1, window, 1)
    y = np.array(y)
    return X, y


# 5. Prophet Helper

def prepare_prophet_df(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure a DataFrame is Prophet-ready (columns ``ds`` and ``y``).

    Handles common column-name variations (``date``, ``Date``, ``price``,
    ``Price``, ``value``, etc.) and coerces types.

    Parameters
    ----------
    df : pd.DataFrame
        Raw DataFrame.

    Returns
    -------
    pd.DataFrame
        Cleaned DataFrame with ``ds`` (datetime64) and ``y`` (float64).
    """
    df = df.copy()

    date_aliases = ["ds", "date", "Date", "DATE", "Arrival_Date", "timestamp"]
    price_aliases = ["y", "price", "Price", "PRICE", "Modal_Price", "value", "Value"]

    ds_col: Optional[str] = None
    y_col: Optional[str] = None

    for alias in date_aliases:
        if alias in df.columns:
            ds_col = alias
            break
    for alias in price_aliases:
        if alias in df.columns:
            y_col = alias
            break

    if ds_col is None:
        raise KeyError(f"No date column found. Tried: {date_aliases}")
    if y_col is None:
        raise KeyError(f"No price/value column found. Tried: {price_aliases}")

    out = pd.DataFrame()
    out["ds"] = pd.to_datetime(df[ds_col], errors="coerce")
    out["y"] = pd.to_numeric(df[y_col], errors="coerce")
    out.dropna(subset=["ds", "y"], inplace=True)
    out.sort_values("ds", inplace=True)
    out.reset_index(drop=True, inplace=True)

    return out


# 6. Live Kerala Mandi Prices — Data.gov.in

_MANDI_RESOURCE = (
    "https://api.data.gov.in/resource/"
    "9ef84268-d588-465a-a308-a864a43d0070"
)

_logger = logging.getLogger("agrostack.data_manager")


class LivePriceInformer:
    """Async fetcher for Kerala mandi prices from Data.gov.in.

    Usage
    -----
    >>> informer = LivePriceInformer()
    >>> result = await informer.fetch("rubber")
    >>> result["avg_modal"]
    17200.0

    The fetcher hardcodes ``filters[state.keyword]=Kerala`` and title-cases
    the commodity name to match Agmarknet conventions.
    """

    def __init__(self, timeout: float = 30.0) -> None:
        self.timeout = timeout

    async def fetch(self, crop_id: str, limit: int = 100) -> Dict[str, Any]:
        """Fetch live Kerala mandi records for *crop_id*.

        Parameters
        ----------
        crop_id : str
            Crop identifier, e.g. ``"rubber"``, ``"coconut"``.
        limit : int
            Maximum number of API records to request.

        Returns
        -------
        Dict[str, Any]
            ``avg_modal``   — mean modal_price across Kerala records.
            ``min_price``   — lowest min_price seen.
            ``max_price``   — highest max_price seen.
            ``record_count``— number of records returned.
            ``markets``     — unique market names.
            ``districts``   — unique Kerala districts.
            ``records``     — list of cleaned record dicts.
        """
        empty: Dict[str, Any] = {
            "avg_modal": 0.0,
            "min_price": 0.0,
            "max_price": 0.0,
            "record_count": 0,
            "markets": [],
            "districts": [],
            "records": [],
        }

        api_key = os.getenv("DATA_GOV_API_KEY", "")
        if not api_key:
            _logger.warning("DATA_GOV_API_KEY not set — skipping live fetch.")
            return empty

        commodity = crop_id.strip().title()

        params = {
            "api-key": api_key,
            "format": "json",
            "filters[state.keyword]": "Kerala",
            "filters[commodity]": commodity,
            "limit": limit,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(_MANDI_RESOURCE, params=params)
                resp.raise_for_status()
                data = resp.json()
            except (httpx.HTTPError, ValueError) as exc:
                _logger.error("Mandi API error: %s", exc)
                return empty

        raw_records = data.get("records", [])
        if not raw_records:
            _logger.info("No Kerala records for '%s'.", commodity)
            return empty

        # Clean and extract pricing fields
        records: List[Dict[str, Any]] = []
        for rec in raw_records:
            try:
                records.append({
                    "state": rec.get("state", ""),
                    "district": rec.get("district", ""),
                    "market": rec.get("market", ""),
                    "commodity": rec.get("commodity", ""),
                    "variety": rec.get("variety", ""),
                    "arrival_date": rec.get("arrival_date", ""),
                    "min_price": float(rec.get("min_price", 0)),
                    "max_price": float(rec.get("max_price", 0)),
                    "modal_price": float(rec.get("modal_price", 0)),
                })
            except (TypeError, ValueError):
                continue

        if not records:
            return empty

        modal_prices = [r["modal_price"] for r in records]
        min_prices = [r["min_price"] for r in records]
        max_prices = [r["max_price"] for r in records]
        markets = sorted({r["market"] for r in records if r.get("market")})
        districts = sorted({r["district"] for r in records if r.get("district")})

        _logger.info(
            "Fetched %d Kerala records for '%s' (avg ₹%.2f).",
            len(records), commodity, float(np.mean(modal_prices)),
        )

        return {
            "avg_modal": round(float(np.mean(modal_prices)), 2),
            "min_price": round(float(min(min_prices)), 2),
            "max_price": round(float(max(max_prices)), 2),
            "record_count": len(records),
            "markets": markets,
            "districts": districts,
            "records": records,
        }


# 7. Live Weather — Open-Meteo (Kottayam default)

_OPENMETEO_CURRENT = "https://api.open-meteo.com/v1/forecast"

# Kottayam, Kerala defaults
_DEFAULT_LAT = 9.5916
_DEFAULT_LON = 76.5222


class WeatherClient:
    """Async weather fetcher from Open-Meteo for Kottayam, Kerala.

    Fetches current conditions and a 24-hour rainfall total for
    waterlogging / biological risk assessment.
    """

    def __init__(self, timeout: float = 15.0) -> None:
        self.timeout = timeout

    async def fetch(
        self,
        lat: float = _DEFAULT_LAT,
        lon: float = _DEFAULT_LON,
    ) -> Dict[str, Any]:
        """Fetch current weather + 24h rainfall for the given coordinates.

        Returns
        -------
        Dict[str, Any]
            ``temp``       — temperature (°C)
            ``humidity``   — relative humidity (%)
            ``precip``     — current precipitation (mm)
            ``rain``       — current rain (mm)
            ``wind_speed`` — wind speed at 10 m (km/h)
            ``rain_24h``   — sum of rain over the last/next 24 hours (mm)
        """
        defaults: Dict[str, Any] = {
            "temp": 0.0,
            "humidity": 0.0,
            "precip": 0.0,
            "rain": 0.0,
            "wind_speed": 0.0,
            "rain_24h": 0.0,
        }

        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,precipitation,rain,showers,wind_speed_10m",
            "hourly": "rain",
            "forecast_days": 1,
            "timezone": "Asia/Kolkata",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(_OPENMETEO_CURRENT, params=params)
                resp.raise_for_status()
                data = resp.json()
            except (httpx.HTTPError, ValueError) as exc:
                _logger.error("Open-Meteo error: %s", exc)
                return defaults

        # Current conditions
        current = data.get("current", {})
        temp = float(current.get("temperature_2m", 0))
        humidity = float(current.get("relative_humidity_2m", 0))
        precip = float(current.get("precipitation", 0))
        rain = float(current.get("rain", 0))
        showers = float(current.get("showers", 0))
        wind_speed = float(current.get("wind_speed_10m", 0))

        # 24-hour rainfall sum from hourly data
        rain_24h = self._calculate_24h_rainfall(data)

        _logger.info(
            "Weather — temp=%.1f°C  humidity=%.0f%%  rain=%.2fmm  "
            "wind=%.1fkm/h  rain_24h=%.1fmm",
            temp, humidity, rain, wind_speed, rain_24h,
        )

        return {
            "temp": round(temp, 1),
            "humidity": round(humidity, 1),
            "precip": round(precip + showers, 2),
            "rain": round(rain, 2),
            "wind_speed": round(wind_speed, 1),
            "rain_24h": round(rain_24h, 1),
        }

    @staticmethod
    def _calculate_24h_rainfall(data: Dict[str, Any]) -> float:
        """Sum hourly rain values over the 24-hour forecast window."""
        hourly = data.get("hourly", {})
        rain_values = hourly.get("rain", [])
        if not rain_values:
            return 0.0
        return round(float(sum(rain_values)), 1)
