"""
engine.py — AgroStack AI Price Engine
=============================================
Combines a **Prophet** seasonality model (70 % weight) with a **TensorFlow
LSTM** shock/volatility model (30 % weight) to produce a fused crop-price
prediction.

    Hybrid_Price = (Prophet_Trend × 0.7) + (LSTM_Residual × 0.3)

Classes
-------
SeasonalityModel  — Prophet wrapper for 12-month cyclical trends.
ShockModel        — LSTM network for 30-day price volatility.
HybridPredictor   — Orchestrator that trains both sub-models and exposes
                     ``get_prediction(crop_id)``.
"""

from __future__ import annotations

import logging
import math
import warnings
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

# Prophet suppresses cmdstanpy logs — silence remaining warnings
warnings.filterwarnings("ignore", category=FutureWarning)
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)
logging.getLogger("prophet").setLevel(logging.WARNING)

from prophet import Prophet
import tensorflow as tf

from data_manager import (
    PriceScaler,
    create_sequences,
    generate_synthetic_data,
    prepare_prophet_df,
)

import operator

logger = logging.getLogger("agrostack.engine")

# Kottayam Agronomic Crop Knowledge Base (25 crops)

CROP_KNOWLEDGE: Dict[str, Dict[str, Any]] = {
    # Plantation & High Value
    "rubber":         {"metric": "precip",    "op": ">", "val": 0.1,  "bias": 1.05, "impact": "Tapping interference detected. Daily supply likely to drop."},
    "black pepper":   {"metric": "humidity",  "op": ">", "val": 85,   "bias": 1.08, "impact": "Fungal stress alert. Potential for spike shedding."},
    "pepper":         {"metric": "humidity",  "op": ">", "val": 85,   "bias": 1.08, "impact": "Fungal stress alert. Potential for spike shedding."},
    "cardamom":       {"metric": "temp",      "op": ">", "val": 30,   "bias": 1.06, "impact": "Heat stress in high-ranges. Quality of green capsules may decline."},
    "coffee robusta": {"metric": "rain_24h",  "op": "<", "val": 10,   "bias": 1.04, "impact": "Blossom shower delay detected; critical for bean setting."},
    "tea":            {"metric": "temp",      "op": "<", "val": 15,   "bias": 1.05, "impact": "Frost/Cold stress in high-altitudes. Slows flush growth."},
    "arecanut":       {"metric": "humidity",  "op": ">", "val": 90,   "bias": 1.07, "impact": "Mahali (fruit rot) risk high due to persistent dampness."},
    "cashew":         {"metric": "precip",    "op": ">", "val": 5,    "bias": 1.04, "impact": "Unseasonal rain during flowering causes nut-drop and mold."},
    # Tubers & Field Crops
    "paddy":          {"metric": "rain_24h",  "op": ">", "val": 50,   "bias": 1.06, "impact": "Submergence risk during grain filling. Supply chain disruption likely."},
    "rice":           {"metric": "rain_24h",  "op": ">", "val": 50,   "bias": 1.06, "impact": "Submergence risk during grain filling. Supply chain disruption likely."},
    "tapioca":        {"metric": "rain_24h",  "op": ">", "val": 120,  "bias": 0.90, "impact": "Root saturation detected. Quality of starch may be affected."},
    "yam":            {"metric": "temp",      "op": ">", "val": 38,   "bias": 1.04, "impact": "Heat stress affecting tuber expansion in laterite soils."},
    "sweet potato":   {"metric": "humidity",  "op": "<", "val": 50,   "bias": 1.03, "impact": "Dry spell detected; critical for vine health in Kottayam midlands."},
    # Fruits & Vegetables
    "banana nendran": {"metric": "wind_speed","op": ">", "val": 40,   "bias": 1.10, "impact": "Lodging risk high for heavy bunches. Supply volatility expected."},
    "banana":         {"metric": "wind_speed","op": ">", "val": 40,   "bias": 1.10, "impact": "Lodging risk high for heavy bunches. Supply volatility expected."},
    "pineapple":      {"metric": "temp",      "op": ">", "val": 34,   "bias": 1.03, "impact": "Sun-scald warning. Grade-A availability may tighten."},
    "jackfruit":      {"metric": "rain_24h",  "op": ">", "val": 80,   "bias": 1.05, "impact": "Internal rot risk due to excessive moisture absorption."},
    "mango":          {"metric": "precip",    "op": ">", "val": 2,    "bias": 1.06, "impact": "Unseasonal rain during bloom may cause 'Powdery Mildew'."},
    "papaya":         {"metric": "humidity",  "op": ">", "val": 95,   "bias": 1.04, "impact": "Anthracnose risk high. Shelf-life of harvest will decrease."},
    "ginger":         {"metric": "rain_24h",  "op": ">", "val": 150,  "bias": 1.08, "impact": "Rhizome rot alert. Extreme moisture in clay-rich soils."},
    "turmeric":       {"metric": "temp",      "op": ">", "val": 36,   "bias": 1.04, "impact": "Leaf blotch risk during extreme heat waves."},
    "nutmeg":         {"metric": "wind_speed","op": ">", "val": 35,   "bias": 1.06, "impact": "Fruit drop alert. High sensitivity to heavy monsoon gusts."},
    "cocoa":          {"metric": "humidity",  "op": "<", "val": 60,   "bias": 1.05, "impact": "Pod desiccation risk. Requires immediate shade management."},
    # Others
    "clove":          {"metric": "temp",      "op": ">", "val": 32,   "bias": 1.04, "impact": "Drying stress on flower buds; impacts oil content."},
    "vanilla":        {"metric": "humidity",  "op": ">", "val": 80,   "bias": 1.05, "impact": "Critical for pollination success and bean length."},
    "betel leaf":     {"metric": "temp",      "op": "<", "val": 18,   "bias": 1.03, "impact": "Cold-induced wilting; common in Kottayam winter nights."},
    "cinnamon":       {"metric": "precip",    "op": ">", "val": 20,   "bias": 1.04, "impact": "Bark peeling difficulty increases with soil moisture spikes."},
    "garlic":         {"metric": "humidity",  "op": ">", "val": 70,   "bias": 1.05, "impact": "Bulb mold risk; requires dry conditions for curing."},
    "coconut":        {"metric": "wind_speed","op": ">", "val": 50,   "bias": 1.12, "impact": "Button shedding / Premature nut fall due to high winds."},
}

_OPS = {
    ">": operator.gt,
    "<": operator.lt,
    ">=": operator.ge,
    "<=": operator.le,
}


class AgronomicAdvisoryLayer:
    """Weather-aware expert system for Kottayam crops.

    Evaluates live weather against crop-specific biological thresholds
    from ``CROP_KNOWLEDGE`` and returns a bias multiplier + impact insight.
    """

    def evaluate(
        self,
        crop_id: str,
        weather: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Check if weather triggers a biological risk for *crop_id*.

        Parameters
        ----------
        crop_id : str
            Crop identifier (lowercase, e.g. ``"rubber"``).
        weather : dict
            Weather snapshot from ``WeatherClient.fetch()``.

        Returns
        -------
        Dict[str, Any]
            ``triggered``            — bool, whether a threshold was breached
            ``biological_risk_alert``— bool (same as triggered)
            ``bias``                 — float multiplier (1.0 if not triggered)
            ``insight``              — str, agronomic impact description
            ``rule_used``            — str, human-readable threshold rule
            ``metric_value``         — float, actual weather value checked
        """
        lookup = crop_id.strip().lower()

        # Try exact match, then title-case match
        rule = CROP_KNOWLEDGE.get(lookup)
        if rule is None:
            # Also try with underscores replaced by spaces
            rule = CROP_KNOWLEDGE.get(lookup.replace("_", " "))

        if rule is None:
            return {
                "triggered": False,
                "biological_risk_alert": False,
                "bias": 1.0,
                "insight": f"No agronomic rules defined for '{crop_id}'.",
                "rule_used": "none",
                "metric_value": None,
            }

        metric = rule["metric"]
        op_str = rule["op"]
        threshold = rule["val"]
        op_fn = _OPS.get(op_str, operator.gt)

        actual_value = float(weather.get(metric, 0))
        triggered = op_fn(actual_value, threshold)

        if triggered:
            return {
                "triggered": True,
                "biological_risk_alert": True,
                "bias": rule["bias"],
                "insight": rule["impact"],
                "rule_used": f"{metric} {op_str} {threshold}",
                "metric_value": actual_value,
            }

        return {
            "triggered": False,
            "biological_risk_alert": False,
            "bias": 1.0,
            "insight": f"No biological risk detected for {crop_id.title()}. Weather within safe thresholds.",
            "rule_used": f"{metric} {op_str} {threshold}",
            "metric_value": actual_value,
        }

# SeasonalityModel — Prophet
class SeasonalityModel:
    """12-month cyclical trend forecaster powered by Meta Prophet.

    Attributes
    ----------
    model : Prophet
        Underlying Prophet instance.
    last_known_price : float | None
        Fallback value used when prediction data is unavailable.
    """

    def __init__(self) -> None:
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
        )
        self.last_known_price: Optional[float] = None
        self._trained = False

    def train(self, df: pd.DataFrame) -> None:
        """Fit Prophet on a ``ds``/``y`` DataFrame.

        Parameters
        ----------
        df : pd.DataFrame
            Must contain ``ds`` (datetime) and ``y`` (float) columns.
        """
        df = prepare_prophet_df(df)
        if df.empty:
            raise ValueError("Training DataFrame is empty after cleaning.")
        self.last_known_price = float(df["y"].iloc[-1])
        self.model.fit(df)
        self._trained = True

    def predict(self, periods: int = 30) -> pd.DataFrame:
        """Forecast *periods* days into the future.

        Parameters
        ----------
        periods : int
            Number of future days to predict.

        Returns
        -------
        pd.DataFrame
            Prophet forecast DataFrame with ``ds``, ``yhat``, etc.
        """
        if not self._trained:
            raise RuntimeError("Model has not been trained yet.")
        future = self.model.make_future_dataframe(periods=periods)
        forecast = self.model.predict(future)
        return forecast

    def get_trend_value(self, periods: int = 1) -> float:
        """Return the predicted price for the next *periods* days.

        Falls back to ``last_known_price`` on any failure.
        """
        try:
            forecast = self.predict(periods)
            return float(forecast["yhat"].iloc[-1])
        except Exception:
            if self.last_known_price is not None:
                return self.last_known_price
            raise


# ShockModel — TensorFlow LSTM
class ShockModel:
    """30-day LSTM for capturing short-term price shocks & volatility.

    Architecture
    ------------
    LSTM(64) → Dropout(0.2) → LSTM(32) → Dropout(0.2) → Dense(1)

    Attributes
    ----------
    model : tf.keras.Model | None
        Compiled Keras model (created via ``build``).
    scaler : PriceScaler
        Min-Max scaler fitted on training prices.
    window : int
        Look-back window (default 30).
    """

    def __init__(self, window: int = 30) -> None:
        self.window = window
        self.model: Optional[tf.keras.Model] = None
        self.scaler = PriceScaler()
        self._trained = False
        self.last_known_price: Optional[float] = None

    def build(self) -> tf.keras.Model:
        """Construct and compile the LSTM network.

        Returns
        -------
        tf.keras.Model
        """
        model = tf.keras.Sequential([
            tf.keras.layers.LSTM(
                64,
                return_sequences=True,
                input_shape=(self.window, 1),
            ),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.LSTM(32, return_sequences=False),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation="relu"),
            tf.keras.layers.Dense(1),
        ])
        model.compile(optimizer="adam", loss="mse", metrics=["mae"])
        self.model = model
        return model

    def train(
        self,
        prices: np.ndarray,
        epochs: int = 20,
        batch_size: int = 32,
        validation_split: float = 0.1,
    ) -> tf.keras.callbacks.History:
        """Scale prices, build sequences, and train the LSTM.

        Parameters
        ----------
        prices : np.ndarray
            1-D array of raw prices.
        epochs : int
            Training epochs.
        batch_size : int
            Mini-batch size.
        validation_split : float
            Fraction of data reserved for validation.

        Returns
        -------
        tf.keras.callbacks.History
        """
        if self.model is None:
            self.build()

        self.last_known_price = float(prices[-1])
        scaled = self.scaler.fit_transform(prices.astype(np.float64))
        X, y = create_sequences(scaled, self.window)

        history = self.model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=0,
        )
        self._trained = True
        return history

    def predict(self, recent_prices: np.ndarray) -> float:
        """Predict the next price given the last *window* raw prices.

        Parameters
        ----------
        recent_prices : np.ndarray
            1-D array of length ``self.window`` (raw, unscaled prices).

        Returns
        -------
        float
            Predicted price in original scale.
        """
        if not self._trained or self.model is None:
            raise RuntimeError("ShockModel has not been trained yet.")

        scaled = self.scaler.transform(recent_prices.astype(np.float64))
        X = scaled.reshape(1, self.window, 1)
        pred_scaled = self.model.predict(X, verbose=0)
        pred = self.scaler.inverse_transform(pred_scaled.flatten())
        return float(pred[0])

    def get_correction(self, recent_prices: np.ndarray) -> float:
        """Return the LSTM-predicted price or fall back to last known.

        This is the value multiplied by 0.3 in the hybrid formula.
        """
        try:
            return self.predict(recent_prices)
        except Exception:
            if self.last_known_price is not None:
                return self.last_known_price
            raise


# HybridPredictor — Fuses Prophet + LSTM

# Default crop mapping — maps crop_id → display name
_DEFAULT_CROPS: Dict[str, str] = {
    "wheat": "Wheat",
    "rice": "Rice",
    "tomato": "Tomato",
    "onion": "Onion",
    "potato": "Potato",
}

PROPHET_WEIGHT = 0.7
LSTM_WEIGHT = 0.3


class HybridPredictor:
    """Orchestrates Prophet + LSTM to produce a fused price prediction.

    Usage
    -----
    >>> predictor = HybridPredictor()
    >>> predictor.train()                     # uses synthetic data by default
    >>> result = predictor.get_prediction("wheat")
    >>> result["hybrid_price"]
    2784.32

    Attributes
    ----------
    seasonality : SeasonalityModel
    shock : ShockModel
    data : pd.DataFrame | None
        Training data (kept for recent-window extraction).
    """

    def __init__(self) -> None:
        self.seasonality = SeasonalityModel()
        self.shock = ShockModel(window=30)
        self.data: Optional[pd.DataFrame] = None
        self._trained = False

    # Training

    def train(self, df: Optional[pd.DataFrame] = None, lstm_epochs: int = 20) -> None:
        """Train both sub-models.

        Parameters
        ----------
        df : pd.DataFrame, optional
            Must contain at least ``ds`` and ``y``. If *None*, synthetic
            demo data is generated automatically.
        lstm_epochs : int
            Number of LSTM training epochs.
        """
        if df is None:
            df = generate_synthetic_data()

        self.data = df.copy()
        prophet_df = prepare_prophet_df(df)

        # Train Prophet
        self.seasonality.train(prophet_df)

        # Train LSTM
        prices = df["y"].values
        self.shock.train(prices, epochs=lstm_epochs)

        self._trained = True

    # Live-price prediction

    def predict_hybrid(
        self,
        crop_id: str,
        current_price: float,
        advisory_bias: float = 1.0,
    ) -> Dict[str, Any]:
        """Produce a 30-day forecast anchored to a *live* current price.

        The formula uses Prophet/LSTM as multipliers on the live base,
        then applies the agronomic advisory bias:

            predicted = current_price × (prophet_mult×0.7 + lstm_mult×0.3) × bias

        Parameters
        ----------
        crop_id : str
            Crop identifier (e.g. ``"rubber"``).
        current_price : float
            Live Kerala avg modal price from ``LivePriceInformer``.
        advisory_bias : float
            Multiplicative bias from ``AgronomicAdvisoryLayer`` (default 1.0).

        Returns
        -------
        Dict[str, Any]
        """
        if not self._trained or self.data is None:
            raise RuntimeError("HybridPredictor has not been trained.")

        crop_name = _DEFAULT_CROPS.get(crop_id, crop_id.title())
        last_known = float(self.data["y"].iloc[-1])

        # Prophet trend
        try:
            prophet_trend = self.seasonality.get_trend_value(periods=30)
        except Exception:
            prophet_trend = last_known

        # LSTM correction
        try:
            recent = self.data["y"].values[-self.shock.window:]
            lstm_correction = self.shock.get_correction(recent)
        except Exception:
            lstm_correction = last_known

        # Multipliers relative to training baseline
        if last_known > 0:
            prophet_mult = prophet_trend / last_known
            lstm_mult = lstm_correction / last_known
        else:
            prophet_mult = 1.0
            lstm_mult = 1.0

        base_predicted = current_price * (
            prophet_mult * PROPHET_WEIGHT + lstm_mult * LSTM_WEIGHT
        )
        predicted_price = round(base_predicted * advisory_bias, 2)

        # XAI
        xai = self._generate_xai_attribution(
            prophet_price=prophet_trend,
            lstm_price=lstm_correction,
        )

        return {
            "crop_id": crop_id,
            "crop_name": crop_name,
            "current_price": round(current_price, 2),
            "predicted_price": predicted_price,
            "bias_applied": round(advisory_bias, 4),
            "prophet_trend": round(prophet_trend, 2),
            "prophet_multiplier": round(prophet_mult, 4),
            "lstm_correction": round(lstm_correction, 2),
            "lstm_multiplier": round(lstm_mult, 4),
            "prophet_weight": PROPHET_WEIGHT,
            "lstm_weight": LSTM_WEIGHT,
            "last_known_training_price": round(last_known, 2),
            **xai,
        }



    def get_prediction(self, crop_id: str = "wheat") -> Dict[str, Any]:
        """Return a hybrid price prediction for *crop_id*.

        The formula is:

            hybrid_price = prophet_trend × 0.7 + lstm_correction × 0.3

        Edge-case handling:
        • If either sub-model fails, the last known price is used as a
          substitute so the API never returns an error.

        Parameters
        ----------
        crop_id : str
            Identifier for the crop (used for labelling; the underlying
            model is shared for the demo).

        Returns
        -------
        Dict[str, Any]
            Keys: ``crop_id``, ``crop_name``, ``hybrid_price``,
            ``prophet_trend``, ``lstm_correction``, ``prophet_weight``,
            ``lstm_weight``.
        """
        if not self._trained or self.data is None:
            raise RuntimeError("HybridPredictor has not been trained. Call train() first.")

        crop_name = _DEFAULT_CROPS.get(crop_id, crop_id.title())
        last_known = float(self.data["y"].iloc[-1])

        # Prophet trend
        try:
            prophet_trend = self.seasonality.get_trend_value(periods=1)
        except Exception:
            prophet_trend = last_known

        # LSTM correction
        try:
            recent = self.data["y"].values[-self.shock.window :]
            lstm_correction = self.shock.get_correction(recent)
        except Exception:
            lstm_correction = last_known

        hybrid_price = round(
            prophet_trend * PROPHET_WEIGHT + lstm_correction * LSTM_WEIGHT, 2
        )

        # --- XAI: Explainable AI attribution ---
        xai = self._generate_xai_attribution(
            prophet_price=prophet_trend,
            lstm_price=lstm_correction,
        )

        return {
            "crop_id": crop_id,
            "crop_name": crop_name,
            "hybrid_price": hybrid_price,
            "prophet_trend": round(prophet_trend, 2),
            "lstm_correction": round(lstm_correction, 2),
            "prophet_weight": PROPHET_WEIGHT,
            "lstm_weight": LSTM_WEIGHT,
            "last_known_price": round(last_known, 2),
            **xai,
        }

    # XAI — Heuristic Feature Attribution

    def _generate_xai_attribution(
        self,
        prophet_price: float,
        lstm_price: float,
    ) -> Dict[str, Any]:
        """Compute explainability metadata for the current prediction.

        Returns
        -------
        Dict[str, Any]
            ``insights`` — natural-language explanation string.
            ``attribution`` — structured dict with weights, shock factor,
            seasonal contribution, and detected anomaly label.
        """
        # 1. Shock influence
        if prophet_price != 0:
            shock_factor = round(
                abs(lstm_price - prophet_price) / abs(prophet_price), 4
            )
        else:
            shock_factor = 0.0

        seasonal_contribution = round(1.0 - shock_factor, 4)

        # 2. Anomaly detection (rainfall & demand)
        anomalies: List[str] = []
        insight_parts: List[str] = []

        if self.data is not None and "rainfall" in self.data.columns:
            rainfall_mean = float(self.data["rainfall"].mean())
            recent_rainfall = float(self.data["rainfall"].iloc[-1])
            if rainfall_mean > 0 and recent_rainfall < 0.80 * rainfall_mean:
                deficit_pct = round(
                    (1 - recent_rainfall / rainfall_mean) * 100, 1
                )
                anomalies.append("Low Precipitation")
                insight_parts.append(f"{deficit_pct}% rainfall deficit")

        if self.data is not None and "demand" in self.data.columns:
            demand_mean = float(self.data["demand"].mean())
            recent_demand = float(self.data["demand"].iloc[-1])
            if demand_mean > 0 and recent_demand > 1.20 * demand_mean:
                anomalies.append("High Demand Volatility")
                insight_parts.append("high demand volatility")

        anomaly_label = ", ".join(anomalies) if anomalies else "None"

        # 3. Natural-language insight
        if insight_parts:
            direction = "increase" if lstm_price >= prophet_price else "decrease"
            insight = (
                f"Price {direction} driven by "
                + " and ".join(insight_parts)
                + "."
            )
        elif shock_factor > 0.15:
            direction = "increase" if lstm_price >= prophet_price else "decrease"
            insight = (
                f"Significant short-term price {direction} detected "
                f"(shock factor {shock_factor:.1%}). "
                f"No single input anomaly identified; "
                f"likely a combination of minor market shifts."
            )
        else:
            insight = (
                "Price is within normal seasonal expectations. "
                "No significant anomalies detected."
            )

        return {
            "insights": insight,
            "attribution": {
                "prophet_weight": PROPHET_WEIGHT,
                "lstm_weight": LSTM_WEIGHT,
                "shock_factor": shock_factor,
                "seasonal_contribution": seasonal_contribution,
                "anomaly_detected": anomaly_label,
            },
        }

    # Analytics

    def get_analytics(self) -> Dict[str, Any]:
        """Return model metadata including confidence score and shock alerts.

        Shock alert is triggered when the absolute percentage deviation
        between Prophet and LSTM exceeds **15 %**.

        Returns
        -------
        Dict[str, Any]
        """
        if not self._trained or self.data is None:
            raise RuntimeError("HybridPredictor not trained.")

        last_known = float(self.data["y"].iloc[-1])

        try:
            prophet_trend = self.seasonality.get_trend_value(periods=1)
        except Exception:
            prophet_trend = last_known

        try:
            recent = self.data["y"].values[-self.shock.window :]
            lstm_correction = self.shock.get_correction(recent)
        except Exception:
            lstm_correction = last_known

        # Deviation %
        if prophet_trend != 0:
            deviation_pct = abs(lstm_correction - prophet_trend) / abs(prophet_trend) * 100
        else:
            deviation_pct = 0.0

        shock_alert = deviation_pct > 15.0

        # Confidence: inverse of deviation (capped at 100)
        confidence = max(0.0, min(100.0, 100.0 - deviation_pct))

        return {
            "confidence_score": round(confidence, 2),
            "shock_alert": shock_alert,
            "deviation_percent": round(deviation_pct, 2),
            "prophet_trend": round(prophet_trend, 2),
            "lstm_correction": round(lstm_correction, 2),
            "data_points_used": len(self.data),
            "lstm_window_days": self.shock.window,
            "model_weights": {
                "prophet": PROPHET_WEIGHT,
                "lstm": LSTM_WEIGHT,
            },
        }
