"""
federatedlearning.py — Simulated Federated Learning for Crop Price Prediction
==============================================================================
Lightweight single-server federated averaging simulation.

Generates synthetic regional price data for Kerala districts, trains
per-region LSTM models, performs federated weight averaging, and produces
30-day price forecasts — all without centralising raw data.

Supported crops : rubber, tea, coffee, mango, banana
Regions         : Kottayam, Idukki, Ernakulam
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
import tensorflow as tf

logger = logging.getLogger("agrostack.federated")

# ── Constants ────────────────────────────────────────────────────────────────

SUPPORTED_CROPS = ["rubber", "tea", "coffee", "mango", "banana"]

REGIONS = ["Kottayam", "Idukki", "Ernakulam"]

DAYS = 365
WINDOW = 30          # look-back window for LSTM sequences
FORECAST_HORIZON = 30

# Base prices (₹ / kg — illustrative)
BASE_PRICES: Dict[str, float] = {
    "rubber":  160.0,
    "tea":      85.0,
    "coffee":  250.0,
    "mango":    60.0,
    "banana":   35.0,
}

# Seasonality amplitude (fraction of base price)
SEASONAL_AMP: Dict[str, float] = {
    "rubber":  0.10,   # medium cyclic
    "tea":     0.12,   # moderate volatility
    "coffee":  0.12,   # moderate volatility
    "mango":   0.25,   # strong summer peak
    "banana":  0.05,   # mild / stable
}

# Phase shift (radians) — mango peaks in summer (~day 120)
SEASONAL_PHASE: Dict[str, float] = {
    "rubber":  0.0,
    "tea":     np.pi / 4,
    "coffee":  np.pi / 3,
    "mango":   -np.pi / 3,   # peaks around day 90-130
    "banana":  0.0,
}

# Region bias (additive ₹ adjustment)
REGION_BIAS: Dict[str, float] = {
    "Kottayam":  0.0,
    "Idukki":    5.0,
    "Ernakulam": -3.0,
}

# Noise scale (fraction of base price)
NOISE_SCALE: Dict[str, float] = {
    "rubber":  0.03,
    "tea":     0.04,
    "coffee":  0.04,
    "mango":   0.05,
    "banana":  0.02,
}


# ── Federated Price Predictor ────────────────────────────────────────────────

class FederatedPricePredictor:
    """Simulated federated learning pipeline for crop price prediction.

    Public API
    ----------
    run_federated_pipeline(crop)  →  dict   (JSON-serialisable result)
    """

    def __init__(self, seed: int = 42) -> None:
        self.seed = seed
        np.random.seed(seed)
        tf.random.set_seed(seed)

    # ── Data Generation ──────────────────────────────────────────────────

    def generate_synthetic_data(self, crop: str) -> pd.DataFrame:
        """Create 365 days of synthetic daily prices for *crop* across all regions.

        Formula per sample:
            price = base + seasonal_component + region_bias + noise

        Returns
        -------
        pd.DataFrame
            Columns: location, crop, day_index, price
        """
        base = BASE_PRICES[crop]
        amp = SEASONAL_AMP[crop] * base
        phase = SEASONAL_PHASE[crop]
        noise_std = NOISE_SCALE[crop] * base

        rows: List[Dict[str, Any]] = []
        for region in REGIONS:
            bias = REGION_BIAS[region]
            for day in range(DAYS):
                seasonal = amp * np.sin(2 * np.pi * day / DAYS + phase)
                noise = np.random.normal(0, noise_std)
                price = base + seasonal + bias + noise
                rows.append({
                    "location": region,
                    "crop": crop,
                    "day_index": day,
                    "price": round(float(price), 2),
                })

        return pd.DataFrame(rows)

    # ── Model Factory ────────────────────────────────────────────────────

    @staticmethod
    def create_model() -> tf.keras.Model:
        """Build a lightweight LSTM model for single-step price prediction.

        Architecture
        ------------
        Input  : (WINDOW, 1)
        LSTM   : 32 units
        Dense  : 1 unit (linear)
        Loss   : MSE
        Optim  : Adam (lr=0.001)
        """
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(WINDOW, 1)),
            tf.keras.layers.LSTM(32),
            tf.keras.layers.Dense(1),
        ])
        model.compile(optimizer="adam", loss="mse")
        return model

    # ── Sequence Preparation ─────────────────────────────────────────────

    @staticmethod
    def prepare_sequences(
        prices: np.ndarray,
        window: int = WINDOW,
    ) -> tuple[np.ndarray, np.ndarray]:
        """Slide a window over *prices* to produce (X, y) pairs.

        Parameters
        ----------
        prices : 1-D array of daily prices.
        window : Number of look-back days.

        Returns
        -------
        X : shape (n_samples, window, 1)
        y : shape (n_samples,)
        """
        X, y = [], []
        for i in range(len(prices) - window):
            X.append(prices[i : i + window])
            y.append(prices[i + window])
        X = np.array(X).reshape(-1, window, 1)
        y = np.array(y)
        return X, y

    # ── Local Training ───────────────────────────────────────────────────

    def train_local_models(
        self,
        df: pd.DataFrame,
        epochs: int = 5,
        batch_size: int = 16,
    ) -> Dict[str, List[np.ndarray]]:
        """Train one LSTM per region on that region's data only.

        Parameters
        ----------
        df : Full synthetic dataset (all regions).
        epochs : Training epochs per local model.
        batch_size : Mini-batch size.

        Returns
        -------
        dict mapping region name → list of weight arrays.
        """
        local_weights: Dict[str, List[np.ndarray]] = {}

        for region in REGIONS:
            region_prices = (
                df.loc[df["location"] == region, "price"]
                .values.astype(np.float32)
            )
            X, y = self.prepare_sequences(region_prices)

            model = self.create_model()
            model.fit(
                X, y,
                epochs=epochs,
                batch_size=batch_size,
                verbose=0,
            )
            local_weights[region] = model.get_weights()
            logger.info("Trained local model for %s  (%d samples)", region, len(y))

        return local_weights

    # ── Federated Averaging ──────────────────────────────────────────────

    @staticmethod
    def federated_average(
        local_weights: Dict[str, List[np.ndarray]],
    ) -> List[np.ndarray]:
        """Compute layer-wise mean of local model weights (FedAvg).

        Parameters
        ----------
        local_weights : {region: [w0, w1, …]}

        Returns
        -------
        List of averaged weight arrays (same structure as a single model).
        """
        regions = list(local_weights.keys())
        n = len(regions)
        num_layers = len(local_weights[regions[0]])

        averaged: List[np.ndarray] = []
        for layer_idx in range(num_layers):
            layer_sum = np.zeros_like(local_weights[regions[0]][layer_idx])
            for region in regions:
                layer_sum += local_weights[region][layer_idx]
            averaged.append(layer_sum / n)

        return averaged

    # ── Forecasting ──────────────────────────────────────────────────────

    def forecast_next_30_days(
        self,
        crop: str,
        df: pd.DataFrame,
        global_weights: List[np.ndarray],
    ) -> Dict[str, Dict[str, List[float]]]:
        """Generate 30-day forecasts per region using the global model.

        The global (federated-averaged) weights are loaded into a fresh model.
        For each region the last WINDOW prices seed an auto-regressive loop.

        Returns
        -------
        {region: {"forecast": [30 floats]}}
        """
        model = self.create_model()
        model.set_weights(global_weights)

        results: Dict[str, Dict[str, List[float]]] = {}

        for region in REGIONS:
            region_prices = (
                df.loc[df["location"] == region, "price"]
                .values.astype(np.float32)
            )
            # Seed with last WINDOW days
            window_buf = list(region_prices[-WINDOW:])
            preds: List[float] = []

            for _ in range(FORECAST_HORIZON):
                x_input = np.array(window_buf[-WINDOW:]).reshape(1, WINDOW, 1)
                next_val = float(model.predict(x_input, verbose=0)[0, 0])
                preds.append(round(next_val, 2))
                window_buf.append(next_val)

            results[region] = {"forecast": preds}
            logger.info("Forecast complete for %s (%s)", region, crop)

        return results

    # ── Public Pipeline ──────────────────────────────────────────────────

    def run_federated_pipeline(self, crop: str) -> Dict[str, Any]:
        """Execute the full federated learning pipeline for a single crop.

        Steps
        -----
        1. Generate synthetic regional data.
        2. Train local LSTM per region.
        3. Federated average the weights.
        4. Forecast 30 days per region with the global model.

        Parameters
        ----------
        crop : One of ``SUPPORTED_CROPS``.

        Returns
        -------
        JSON-serialisable dict:
        {
            "crop": str,
            "regions": {
                "<Region>": {"forecast": [30 floats]},
                ...
            }
        }
        """
        crop = crop.strip().lower()
        if crop not in SUPPORTED_CROPS:
            raise ValueError(
                f"Unsupported crop '{crop}'. Choose from {SUPPORTED_CROPS}"
            )

        logger.info("═══ Federated pipeline START — crop: %s ═══", crop)

        # 1. Synthetic data
        df = self.generate_synthetic_data(crop)
        logger.info("Generated %d synthetic records", len(df))

        # 2. Local training
        local_weights = self.train_local_models(df, epochs=5, batch_size=16)

        # 3. Federated averaging
        global_weights = self.federated_average(local_weights)
        logger.info("Federated averaging complete (%d layers)", len(global_weights))

        # 4. Forecast
        region_forecasts = self.forecast_next_30_days(crop, df, global_weights)

        logger.info("═══ Federated pipeline DONE — crop: %s ═══", crop)

        return {
            "crop": crop,
            "regions": region_forecasts,
        }

    # ── Region Recommendation ────────────────────────────────────────────

    def recommend_best_region(
        self,
        crop: str,
        current_price: float,
        current_location: str,
    ) -> Dict[str, Any]:
        """Recommend the best region to sell a crop based on federated forecasts.

        Runs the full federated pipeline, computes the average predicted price
        over the next 7 days for each region, and compares against the caller's
        *current_price* to determine the optimal selling location.

        Parameters
        ----------
        crop : One of ``SUPPORTED_CROPS``.
        current_price : The seller's current price (₹).
        current_location : One of ``REGIONS``.

        Returns
        -------
        JSON-serialisable dict with recommendation details.
        """
        crop = crop.strip().lower()
        if crop not in SUPPORTED_CROPS:
            raise ValueError(
                f"Unsupported crop '{crop}'. Choose from {SUPPORTED_CROPS}"
            )

        current_location = current_location.strip().title()
        if current_location not in REGIONS:
            raise ValueError(
                f"Unknown region '{current_location}'. Choose from {REGIONS}"
            )

        # Reuse federated pipeline (trains + forecasts)
        pipeline_result = self.run_federated_pipeline(crop)
        region_forecasts = pipeline_result["regions"]

        # Compute average predicted price for next 7 days per region
        avg_7d: Dict[str, float] = {}
        for region, data in region_forecasts.items():
            first_7 = data["forecast"][:7]
            avg_7d[region] = round(float(np.mean(first_7)), 2)

        # Determine best region
        best_region = max(avg_7d, key=avg_7d.get)  # type: ignore[arg-type]
        best_avg = avg_7d[best_region]
        price_diff = round(best_avg - current_price, 2)

        # Build response
        if best_region == current_location:
            return {
                "crop": crop,
                "current_location": current_location,
                "current_price": current_price,
                "best_region": current_location,
                "expected_avg_price_next_7_days": best_avg,
                "price_difference": price_diff,
                "all_region_averages": avg_7d,
                "recommendation": "Current location is optimal for selling",
            }

        return {
            "crop": crop,
            "current_location": current_location,
            "current_price": current_price,
            "best_region": best_region,
            "expected_avg_price_next_7_days": best_avg,
            "price_difference": price_diff,
            "all_region_averages": avg_7d,
            "recommendation": (
                f"Sell in {best_region} for higher expected returns"
            ),
        }
