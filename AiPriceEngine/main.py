"""
main.py — AgroStack Kottayam Agronomic Expert System
=====================================================
Endpoints
---------
GET /predict/{crop_id}
    Fetches live Kerala mandi prices, live Kottayam weather, evaluates
    agronomic advisory rules, and returns an RSA-PSS signed prediction.

GET /analytics
    Returns confidence score, shock alert, and model metadata.

GET /public-key
    Exports the RSA public key (PEM) for signature verification.

Run
---
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import asyncio
import json
import datetime as dt
import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

from engine import HybridPredictor, AgronomicAdvisoryLayer
from data_manager import LivePriceInformer, WeatherClient

logger = logging.getLogger("agrostack")
logging.basicConfig(level=logging.INFO)

# RSA Digital Signature Utility

class RSASigner:
    """Generate an RSA key-pair and sign / verify JSON payloads."""

    def __init__(self, key_size: int = 2048) -> None:
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
        )
        self.public_key = self.private_key.public_key()

    def sign(self, payload: Dict[str, Any]) -> str:
        canonical = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
        signature = self.private_key.sign(
            canonical,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )
        return signature.hex()

    def verify(self, payload: Dict[str, Any], signature_hex: str) -> bool:
        canonical = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
        try:
            self.public_key.verify(
                bytes.fromhex(signature_hex),
                canonical,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH,
                ),
                hashes.SHA256(),
            )
            return True
        except Exception:
            return False

    def export_public_key_pem(self) -> str:
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")


# Application Globals

predictor: HybridPredictor = HybridPredictor()
signer: RSASigner = RSASigner()
live_informer: LivePriceInformer = LivePriceInformer()
weather_client: WeatherClient = WeatherClient()
advisor: AgronomicAdvisoryLayer = AgronomicAdvisoryLayer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Train the hybrid model on startup using synthetic demo data."""
    dgov_key = os.getenv("DATA_GOV_API_KEY", "")
    if dgov_key:
        logger.info("✅ DATA_GOV_API_KEY loaded.")
    else:
        logger.warning("⚠️  DATA_GOV_API_KEY not set — live data unavailable.")

    logger.info("⏳ Training Hybrid AI Price Engine (Prophet + LSTM) …")
    predictor.train(lstm_epochs=10)
    logger.info("✅ Model training complete — API is ready.")
    logger.info("🔑 RSA-2048 key-pair generated (in-memory).")
    logger.info("🌿 Agronomic Advisory Layer active (25 crops).")
    yield
    logger.info("🛑 Shutting down AgroStack API.")

# FastAPI

app = FastAPI(
    title="AgroStack — Kottayam Agronomic Expert System",
    description=(
        "Kerala-specific crop price prediction with weather-aware "
        "agronomic advisory. Live mandi data from Data.gov.in (Agmarknet), "
        "Open-Meteo weather, Prophet + LSTM AI, and biological risk alerts. "
        "Every prediction is RSA-PSS signed."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints

@app.get("/", tags=["Health"])
async def root():
    """Health-check / welcome endpoint."""
    return {
        "service": "AgroStack Kottayam Agronomic Expert System",
        "version": "3.0.0",
        "state": "Kerala",
        "district": "Kottayam",
        "status": "operational",
        "crops_covered": 25,
        "docs": "/docs",
    }


@app.get("/predict/{crop_id}", tags=["Prediction"])
async def predict(
    crop_id: str,
    lat: Optional[float] = Query(None, description="Latitude (default: Kottayam 9.5916)"),
    lon: Optional[float] = Query(None, description="Longitude (default: Kottayam 76.5222)"),
):
    """Return a Kerala-specific hybrid price prediction with agronomic advisory.

    **Flow**

    1. Fetch live Kerala mandi prices + Kottayam weather (parallel)
    2. If 0 mandi records → return a clear JSON error
    3. Evaluate agronomic advisory (biological risk thresholds)
    4. Apply AI engine with advisory bias
    5. RSA-PSS sign the entire payload

    **Response fields**

    | Field                    | Description                                   |
    |--------------------------|-----------------------------------------------|
    | `crop_id`                | Normalised crop identifier                    |
    | `current_price`          | Live Kerala avg modal price (₹/quintal)       |
    | `predicted_price`        | 30-day AI forecast (with advisory bias)       |
    | `biological_risk_alert`  | True if weather triggered a crop risk         |
    | `advisory`               | Agronomic insight and rule details            |
    | `weather_snapshot`       | Live Kottayam weather conditions              |
    | `market_summary`         | Aggregated Kerala market stats                |
    | `signature`              | RSA-PSS hex signature over the payload        |
    """
    crop_name = crop_id.strip().title()

    # 1. Fetch mandi data + weather in parallel
    weather_kwargs = {}
    if lat is not None:
        weather_kwargs["lat"] = lat
    if lon is not None:
        weather_kwargs["lon"] = lon

    market_task = live_informer.fetch(crop_id)
    weather_task = weather_client.fetch(**weather_kwargs)
    market_data, weather = await asyncio.gather(market_task, weather_task)

    # 2. No mandi records → clear JSON error
    if market_data["record_count"] == 0:
        return {
            "error": True,
            "message": f"No active Mandi records for {crop_name} in Kerala today.",
            "crop_id": crop_id.lower(),
            "crop_name": crop_name,
            "state": "Kerala",
            "weather_snapshot": weather,
            "source": "data.gov.in",
            "source_timestamp": dt.datetime.utcnow().isoformat() + "Z",
        }

    current_price = market_data["avg_modal"]

    # 3. Agronomic advisory evaluation
    advisory = advisor.evaluate(crop_id.lower(), weather)

    # 4. AI prediction with advisory bias
    try:
        prediction = predictor.predict_hybrid(
            crop_id=crop_id.lower(),
            current_price=current_price,
            advisory_bias=advisory["bias"],
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # 5. Build signable payload
    source_timestamp = dt.datetime.utcnow().isoformat() + "Z"

    market_summary = {
        "avg_modal": market_data["avg_modal"],
        "min_price": market_data["min_price"],
        "max_price": market_data["max_price"],
        "record_count": market_data["record_count"],
        "markets": market_data["markets"],
        "districts": market_data["districts"],
    }

    # Combine AI insight with advisory insight
    combined_insight = prediction["insights"]
    if advisory["triggered"]:
        combined_insight = f"{advisory['insight']} | {combined_insight}"

    payload = {
        "crop_id": prediction["crop_id"],
        "crop_name": prediction["crop_name"],
        "state": "Kerala",
        "district": "Kottayam",
        "current_price": prediction["current_price"],
        "predicted_price": prediction["predicted_price"],
        "bias_applied": prediction["bias_applied"],
        "biological_risk_alert": advisory["biological_risk_alert"],
        "advisory": {
            "triggered": advisory["triggered"],
            "insight": advisory["insight"],
            "rule_used": advisory["rule_used"],
            "metric_value": advisory["metric_value"],
            "bias": advisory["bias"],
        },
        "prophet_trend": prediction["prophet_trend"],
        "prophet_multiplier": prediction["prophet_multiplier"],
        "lstm_correction": prediction["lstm_correction"],
        "lstm_multiplier": prediction["lstm_multiplier"],
        "prophet_weight": prediction["prophet_weight"],
        "lstm_weight": prediction["lstm_weight"],
        "insights": combined_insight,
        "attribution": {
            **prediction["attribution"],
            "data_source": "Agmarknet_Kerala_Live",
        },
        "weather_snapshot": weather,
        "market_summary": market_summary,
        "source_timestamp": source_timestamp,
    }

    # 6. RSA-PSS sign (covers insights, bias_applied, advisory)
    signature = signer.sign(payload)

    return {
        **payload,
        "signature": signature,
    }


@app.get("/analytics", tags=["Analytics"])
async def analytics():
    """Return model analytics: confidence score, shock alerts, and metadata."""
    try:
        result = predictor.get_analytics()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {
        **result,
        "timestamp": dt.datetime.utcnow().isoformat() + "Z",
    }


@app.get("/public-key", tags=["Security"])
async def public_key():
    """Export the RSA public key (PEM) for signature verification."""
    return {
        "algorithm": "RSA-PSS / SHA-256",
        "key_format": "PEM",
        "public_key": signer.export_public_key_pem(),
    }
