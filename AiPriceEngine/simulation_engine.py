"""
simulation_engine.py — AgroStack What-If Profit Simulator
==========================================================
A fully independent, deterministic simulation module for the farmer
dashboard. Uses live data from DATA_GOV API (market prices) and
Open-Meteo API (weather/rainfall) for accurate simulations.

Units
-----
- Yield      → kg
- Price      → ₹/kg  (DATA_GOV returns ₹/quintal, converted ÷ 100)
- Land       → acres
- Rainfall   → mm (seasonal equivalent)
- Temperature→ °C

Route
-----
GET /simulate/{crop_id}
    Accepts land size and cost parameters. Market price and rainfall
    are automatically fetched from live APIs.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import BaseModel, Field

logger = logging.getLogger("agrostack.simulation")

# ─── Constants ───────────────────────────────────────────────────────

KG_PER_QUINTAL: float = 100.0
FALLBACK_PRICE_PER_QUINTAL: float = 2000.0   # ₹/quintal fallback
FALLBACK_PRICE_PER_KG: float = FALLBACK_PRICE_PER_QUINTAL / KG_PER_QUINTAL
MAX_YIELD_PER_ACRE_KG: float = 6000.0        # Validation cap
PRICE_VOLATILITY_PERCENT: float = 12.0       # ±12% for risk analysis
MONTHLY_STORAGE_COST_PER_KG: float = 1.5     # ₹/kg/month storage cost

# ─── Seasonal Multipliers ───────────────────────────────────────────

SEASONAL_MULTIPLIER_3M: float = 1.05   # +5% in 3 months
SEASONAL_MULTIPLIER_6M: float = 1.10   # +10% in 6 months

# ─── Confidence Model ───────────────────────────────────────────────

BASE_CONFIDENCE_PERCENT: float = 75.0
CONFIDENCE_REDUCE_HIGH_VOLATILITY: float = 10.0
CONFIDENCE_REDUCE_LOW_RAINFALL: float = 10.0
LOW_RAINFALL_THRESHOLD_MM: float = 700.0  # seasonal

WEATHER_API_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=9.5916&longitude=76.5227"
    "&hourly=temperature_2m,precipitation,rain,wind_speed_10m"
)

# ─── Crop Database ──────────────────────────────────────────────────

CROP_DATA: Dict[str, Dict[str, Any]] = {
    "rice": {
        "base_yield_per_acre_kg": 2500,
        "optimal_temp": (20, 35),
        "seasonal_rainfall_mm": 1200,
    },
    "rubber": {
        "base_yield_per_acre_kg": 1500,
        "optimal_temp": (22, 35),
        "seasonal_rainfall_mm": 2000,
    },
    "coconut": {
        "base_yield_per_acre_kg": 4000,
        "optimal_temp": (20, 35),
        "seasonal_rainfall_mm": 1500,
    },
    "pepper": {
        "base_yield_per_acre_kg": 350,
        "optimal_temp": (20, 30),
        "seasonal_rainfall_mm": 2500,
    },
    "cardamom": {
        "base_yield_per_acre_kg": 200,
        "optimal_temp": (10, 25),
        "seasonal_rainfall_mm": 3000,
    },
    "tea": {
        "base_yield_per_acre_kg": 1800,
        "optimal_temp": (15, 30),
        "seasonal_rainfall_mm": 2000,
    },
    "banana": {
        "base_yield_per_acre_kg": 3500,
        "optimal_temp": (20, 35),
        "seasonal_rainfall_mm": 1200,
    },
}

# Fallback for unknown crops
DEFAULT_CROP = {
    "base_yield_per_acre_kg": 2000,
    "optimal_temp": (20, 35),
    "seasonal_rainfall_mm": 1200,
}

# ─── Rainfall Factor Tiers ──────────────────────────────────────────

RAINFALL_TIERS: List[Dict[str, float]] = [
    {"min_mm": 1200, "factor": 1.0},
    {"min_mm":  900, "factor": 0.9},
    {"min_mm":  700, "factor": 0.75},
    {"min_mm":  500, "factor": 0.6},
    {"min_mm":    0, "factor": 0.4},
]

# ─── Temperature Factor Ranges ──────────────────────────────────────

TEMP_MODERATE_RANGE = (15, 40)   # °C
TEMP_OPTIMAL_FACTOR   = 1.0
TEMP_MODERATE_FACTOR  = 0.85
TEMP_EXTREME_FACTOR   = 0.7


# ═══════════════════════════════════════════════════════════════════
# Pydantic Models
# ═══════════════════════════════════════════════════════════════════

class SimulationInputs(BaseModel):
    """Validated parameters coming from the farmer dashboard."""

    land_size: float = Field(
        ..., ge=0.0,
        description="Land size in acres.",
    )
    fertilizer_cost: float = Field(
        ..., ge=0.0,
        description="Total fertilizer cost (₹).",
    )
    labour_cost: float = Field(
        ..., ge=0.0,
        description="Total labour cost (₹).",
    )


class WeatherResult(BaseModel):
    """Real-time weather data from Open-Meteo."""

    temperature: float
    precipitation: float
    rain: float
    wind_speed: float
    unit_temp: str = "°C"
    unit_precip: str = "mm"
    unit_rain: str = "mm"
    unit_wind: str = "km/h"


class ProfitRange(BaseModel):
    """Profit range considering price volatility."""
    low: float
    high: float


class SimulationResult(BaseModel):
    """Structured response returned to the frontend."""

    crop_id: str
    inputs: Dict[str, float]
    simulation: Dict[str, Any]
    weather: Optional[WeatherResult] = None
    status: str = "success"


# ═══════════════════════════════════════════════════════════════════
# Weather Factor Calculations
# ═══════════════════════════════════════════════════════════════════

def calculate_rainfall_factor(
    seasonal_rain_mm: float,
    tiers: List[Dict[str, float]] = RAINFALL_TIERS,
) -> float:
    """Map seasonal rainfall (mm) to a yield multiplier using tiered thresholds.

    1200+ mm → 1.0, 900–1199 → 0.9, 700–899 → 0.75, 500–699 → 0.6, <500 → 0.4
    """
    for tier in tiers:
        if seasonal_rain_mm >= tier["min_mm"]:
            return tier["factor"]
    return tiers[-1]["factor"]  # Fallback to last (lowest) tier


def calculate_temperature_factor(
    temp_c: float,
    optimal_range: tuple[float, float] = (20, 35),
) -> float:
    """Map temperature to a yield multiplier.

    Within optimal range      → 1.0
    Within moderate [15, 40]  → 0.85
    Outside both (extreme)    → 0.7
    """
    opt_lo, opt_hi = optimal_range
    mod_lo, mod_hi = TEMP_MODERATE_RANGE

    if opt_lo <= temp_c <= opt_hi:
        return TEMP_OPTIMAL_FACTOR
    if mod_lo <= temp_c <= mod_hi:
        return TEMP_MODERATE_FACTOR
    return TEMP_EXTREME_FACTOR


def estimate_seasonal_rainfall(hourly_rain_mm: float) -> float:
    """Estimate seasonal rainfall from a single hourly reading.

    Very rough heuristic: hourly rate × 24 hours × 120 days (season).
    This is an approximation — in production, aggregate historical data.
    """
    return hourly_rain_mm * 24 * 120


# ═══════════════════════════════════════════════════════════════════
# Calculation Core
# ═══════════════════════════════════════════════════════════════════

def run_simulation(
    market_price_per_quintal: float,
    rain_mm_hourly: float,
    temperature_c: float,
    inputs: SimulationInputs,
    crop_id: str,
) -> Dict[str, Any]:
    """Execute the deterministic profit-simulation formula.

    All yields in **kg**, all prices in **₹/kg**.

    Parameters
    ----------
    market_price_per_quintal : float
        Live mandi average modal price (₹/quintal) from DATA_GOV API.
    rain_mm_hourly : float
        Current hourly rainfall (mm) from Open-Meteo API.
    temperature_c : float
        Current temperature (°C) from Open-Meteo API.
    inputs : SimulationInputs
        User-adjustable parameters (land size, costs).
    crop_id : str
        Crop identifier for looking up base yield data.

    Returns
    -------
    Dict[str, Any]
        All intermediate + final values for full transparency.
    """
    # ── 1. Get crop-specific data ──────────────────────────────────
    crop_info = CROP_DATA.get(crop_id.lower(), DEFAULT_CROP)
    base_yield_per_acre_kg = crop_info["base_yield_per_acre_kg"]
    optimal_temp = crop_info["optimal_temp"]

    # ── 2. Convert price: ₹/quintal → ₹/kg ────────────────────────
    market_price_per_kg = market_price_per_quintal / KG_PER_QUINTAL

    # ── 3. Calculate weather factors ───────────────────────────────
    seasonal_rain_mm = estimate_seasonal_rainfall(rain_mm_hourly)
    rainfall_factor = calculate_rainfall_factor(seasonal_rain_mm)
    temperature_factor = calculate_temperature_factor(temperature_c, optimal_temp)

    # ── 4. Adjusted yield (kg) ─────────────────────────────────────
    adjusted_yield_kg = (
        base_yield_per_acre_kg
        * rainfall_factor
        * temperature_factor
        * inputs.land_size
    )

    # ── 5. Validation: cap yield at 6000 kg/acre ──────────────────
    yield_per_acre = adjusted_yield_kg / max(inputs.land_size, 0.01)
    if yield_per_acre > MAX_YIELD_PER_ACRE_KG:
        adjusted_yield_kg = MAX_YIELD_PER_ACRE_KG * inputs.land_size

    # ── 6. Revenue & Profit ────────────────────────────────────────
    gross_revenue = adjusted_yield_kg * market_price_per_kg
    total_cost = inputs.fertilizer_cost + inputs.labour_cost
    predicted_profit = gross_revenue - total_cost

    # ── 7. Break-Even Price ──────────────────────────────────────────
    break_even_price = total_cost / max(adjusted_yield_kg, 0.01)

    # ── 8. Risk Analysis ───────────────────────────────────────────
    vol = PRICE_VOLATILITY_PERCENT / 100
    profit_low  = (adjusted_yield_kg * market_price_per_kg * (1 - vol)) - total_cost
    profit_high = (adjusted_yield_kg * market_price_per_kg * (1 + vol)) - total_cost

    # Risk level based on volatility thresholds
    if PRICE_VOLATILITY_PERCENT < 8:
        risk_level = "low"
    elif PRICE_VOLATILITY_PERCENT <= 15:
        risk_level = "medium"
    else:
        risk_level = "high"

    # ── 9. Forward Price Projection with Storage Costs ─────────────
    price_3m = market_price_per_kg * SEASONAL_MULTIPLIER_3M
    price_6m = market_price_per_kg * SEASONAL_MULTIPLIER_6M

    # Storage costs
    storage_cost_3m = adjusted_yield_kg * MONTHLY_STORAGE_COST_PER_KG * 3
    storage_cost_6m = adjusted_yield_kg * MONTHLY_STORAGE_COST_PER_KG * 6

    # Net profits after storage
    revenue_3m = adjusted_yield_kg * price_3m
    revenue_6m = adjusted_yield_kg * price_6m
    net_profit_3m = revenue_3m - total_cost - storage_cost_3m
    net_profit_6m = revenue_6m - total_cost - storage_cost_6m
    current_profit = gross_revenue - total_cost  # selling now, no storage

    # Volatility bands for projected prices
    low_price_3m  = price_3m * (1 - vol)
    high_price_3m = price_3m * (1 + vol)
    low_price_6m  = price_6m * (1 - vol)
    high_price_6m = price_6m * (1 + vol)

    # ── 10. Confidence Score ───────────────────────────────────────
    confidence = BASE_CONFIDENCE_PERCENT
    if PRICE_VOLATILITY_PERCENT > 15:
        confidence -= CONFIDENCE_REDUCE_HIGH_VOLATILITY
    if seasonal_rain_mm < LOW_RAINFALL_THRESHOLD_MM:
        confidence -= CONFIDENCE_REDUCE_LOW_RAINFALL
    confidence = max(0, min(100, confidence))  # clamp 0–100

    # ── 11. Smart Recommendation ───────────────────────────────────
    if market_price_per_kg < break_even_price:
        recommendation = (
            "⚠️ Current price is below break-even (₹{:.2f}/kg). "
            "Consider reducing costs or waiting for a price recovery."
        ).format(break_even_price)
    elif price_3m < break_even_price and price_6m < break_even_price:
        recommendation = (
            "📉 Projected prices remain below break-even. "
            "Sell now to minimize losses."
        )
    elif risk_level == "high":
        recommendation = (
            "⚡ High market volatility detected. Consider selling "
            "50% now and holding the rest for better prices."
        )
    elif net_profit_6m > net_profit_3m and net_profit_6m > current_profit:
        recommendation = (
            "📈 Holding for 6 months is projected to yield the highest profit "
            "(₹{:,.0f} vs ₹{:,.0f} now), even after storage costs."
        ).format(net_profit_6m, current_profit)
    elif net_profit_3m > current_profit:
        recommendation = (
            "📊 Selling after 3 months offers better returns "
            "(₹{:,.0f} vs ₹{:,.0f} now) with moderate risk."
        ).format(net_profit_3m, current_profit)
    else:
        recommendation = (
            "✅ Selling now is your best option at current prices. "
            "Projected gains don't justify storage costs."
        )

    return {
        "base_yield_per_acre_kg": round(base_yield_per_acre_kg, 2),
        "adjusted_yield_kg": round(adjusted_yield_kg, 2),
        "market_price_per_kg": round(market_price_per_kg, 2),
        "rainfall_factor": round(rainfall_factor, 4),
        "temperature_factor": round(temperature_factor, 4),
        "seasonal_rain_estimate_mm": round(seasonal_rain_mm, 2),
        "gross_revenue": round(gross_revenue, 2),
        "total_cost": round(total_cost, 2),
        "predicted_profit": round(predicted_profit, 2),
        "break_even_price": round(break_even_price, 2),
        "profit_range": {
            "low": round(profit_low, 2),
            "high": round(profit_high, 2),
        },
        "forward_projection": {
            "current": {
                "price_per_kg": round(market_price_per_kg, 2),
                "profit": round(current_profit, 2),
            },
            "three_month": {
                "expected_price": round(price_3m, 2),
                "price_range": {
                    "low": round(low_price_3m, 2),
                    "high": round(high_price_3m, 2),
                },
                "storage_cost": round(storage_cost_3m, 2),
                "net_profit_after_storage": round(net_profit_3m, 2),
            },
            "six_month": {
                "expected_price": round(price_6m, 2),
                "price_range": {
                    "low": round(low_price_6m, 2),
                    "high": round(high_price_6m, 2),
                },
                "storage_cost": round(storage_cost_6m, 2),
                "net_profit_after_storage": round(net_profit_6m, 2),
            },
        },
        "risk_level": risk_level,
        "confidence_score_percent": round(confidence, 1),
        "recommendation": recommendation,
    }


# ═══════════════════════════════════════════════════════════════════
# Weather Fetch
# ═══════════════════════════════════════════════════════════════════

async def fetch_weather_forecast() -> Optional[WeatherResult]:
    """Fetch current weather forecast from Open-Meteo."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(WEATHER_API_URL, timeout=5.0)
            response.raise_for_status()
            data = response.json()

            hourly = data.get("hourly", {})
            if not hourly:
                return None

            idx = 0

            return WeatherResult(
                temperature=hourly["temperature_2m"][idx],
                precipitation=hourly["precipitation"][idx],
                rain=hourly["rain"][idx],
                wind_speed=hourly["wind_speed_10m"][idx],
            )
    except Exception as exc:
        logger.warning(f"Weather fetch failed: {exc}")
        return None


# ═══════════════════════════════════════════════════════════════════
# Router Factory
# ═══════════════════════════════════════════════════════════════════

def create_simulation_router(live_informer: Any) -> APIRouter:
    """Build and return the ``/simulate`` router.

    Parameters
    ----------
    live_informer : LivePriceInformer
        Existing application-level informer instance (read-only usage).
    """
    router = APIRouter(tags=["Simulation"])

    @router.get("/simulate/{crop_id}")
    async def simulate(
        crop_id: str = Path(
            ..., description="Crop identifier (e.g. rubber, coconut, rice).",
        ),
        land_size: float = Query(
            1.0, ge=0.0, description="Land size in acres.",
        ),
        fertilizer_cost: float = Query(
            0.0, ge=0.0, description="Total fertilizer cost (₹).",
        ),
        labour_cost: float = Query(
            0.0, ge=0.0, description="Total labour cost (₹).",
        ),
        # Optional weather overrides (if not provided, live API is used)
        temperature: Optional[float] = Query(
            None,
            description="Override temperature (°C). If omitted, fetches live data from Open-Meteo.",
        ),
        precipitation: Optional[float] = Query(
            None,
            description="Override precipitation (mm). If omitted, fetches live data from Open-Meteo.",
        ),
        rain: Optional[float] = Query(
            None,
            description="Override rain (mm). If omitted, fetches live data from Open-Meteo.",
        ),
        wind_speed: Optional[float] = Query(
            None,
            description="Override wind speed (km/h). If omitted, fetches live data from Open-Meteo.",
        ),
    ) -> Dict[str, Any]:
        """Run a What-If profit simulation for a given crop.

        Market price is fetched live from DATA_GOV API (₹/quintal → ₹/kg).
        Weather/rainfall data is fetched live from Open-Meteo API.
        All yields are in **kg**, all prices in **₹/kg**.
        Includes ±10% price volatility risk analysis.
        """
        # ── 1. Fetch live market price from DATA_GOV API ──────────
        base_price_quintal = FALLBACK_PRICE_PER_QUINTAL
        try:
            market_data = await live_informer.fetch(crop_id)
            if market_data["record_count"] > 0:
                base_price_quintal = market_data["avg_modal"]
        except Exception:
            pass

        # ── 2. Fetch weather from Open-Meteo (if any param missing)
        weather_res = None
        if any(v is None for v in [temperature, precipitation, rain, wind_speed]):
            weather_res = await fetch_weather_forecast()

        # Consolidate weather (User override > API > Defaults)
        final_temp = (
            temperature if temperature is not None
            else (weather_res.temperature if weather_res else 25.0)
        )
        final_precip = (
            precipitation if precipitation is not None
            else (weather_res.precipitation if weather_res else 0.0)
        )
        final_rain = (
            rain if rain is not None
            else (weather_res.rain if weather_res else 0.0)
        )
        final_wind = (
            wind_speed if wind_speed is not None
            else (weather_res.wind_speed if weather_res else 5.0)
        )

        # ── 3. Pack user inputs ───────────────────────────────────
        try:
            inputs = SimulationInputs(
                land_size=land_size,
                fertilizer_cost=fertilizer_cost,
                labour_cost=labour_cost,
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        # ── 4. Run simulation using live data ─────────────────────
        try:
            simulation = run_simulation(
                market_price_per_quintal=base_price_quintal,
                rain_mm_hourly=final_rain,
                temperature_c=final_temp,
                inputs=inputs,
                crop_id=crop_id,
            )
        except Exception as exc:
            logger.error("Simulation calculation error: %s", exc)
            raise HTTPException(status_code=500, detail="Internal error.")

        # ── 5. Build response ─────────────────────────────────────
        return SimulationResult(
            crop_id=crop_id.lower(),
            inputs={
                "land_size": inputs.land_size,
                "fertilizer_cost": inputs.fertilizer_cost,
                "labour_cost": inputs.labour_cost,
            },
            simulation=simulation,
            weather=WeatherResult(
                temperature=final_temp,
                precipitation=final_precip,
                rain=final_rain,
                wind_speed=final_wind,
            ),
        ).model_dump()

    return router
