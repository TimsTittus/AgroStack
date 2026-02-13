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

    # Prediction

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
