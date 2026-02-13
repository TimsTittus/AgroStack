"""
main.py — AgroStack Kerala Real-Time AI Price Engine
=====================================================
Endpoints
---------
GET /predict/{crop_id}
    Fetches live Kerala mandi prices from Data.gov.in, applies the hybrid
    AI engine (Prophet × 0.7 + LSTM × 0.3) as multipliers on the live
    base price, and returns an RSA-PSS signed payload.

GET /analytics
    Returns confidence score, shock alert, and model metadata.

GET /public-key
    Exports the RSA public key (PEM) for signature verification.

Run
---
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import json
import datetime as dt
import hashlib
import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict

from dotenv import load_dotenv

# Load .env before anything reads environment variables
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

from engine import HybridPredictor
from data_manager import LivePriceInformer

logger = logging.getLogger("agrostack")
logging.basicConfig(level=logging.INFO)


# ── RSA Digital Signature Utility ────────────────────────────────────

class RSASigner:
    """Generate an RSA key-pair and sign / verify JSON payloads.

    The private key lives only in-memory for the lifetime of the server
    process.  The public key can be exported and shared with a smart-contract
    verifier.

    Attributes
    ----------
    private_key : rsa.RSAPrivateKey
    public_key  : rsa.RSAPublicKey
    """

    def __init__(self, key_size: int = 2048) -> None:
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
        )
        self.public_key = self.private_key.public_key()

    def sign(self, payload: Dict[str, Any]) -> str:
        """Return a hex-encoded RSA-PSS signature of the canonical JSON payload.
        The payload is serialised with sorted keys and no extra whitespace
        before signing, ensuring deterministic hashing."""
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
        """Verify a previously generated signature against *payload*."""
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
        """Export the public key as a PEM-encoded string."""
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")


# ── Application Globals ──────────────────────────────────────────────

predictor: HybridPredictor = HybridPredictor()
signer: RSASigner = RSASigner()
live_informer: LivePriceInformer = LivePriceInformer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Train the hybrid model on startup using synthetic demo data."""
    dgov_key = os.getenv("DATA_GOV_API_KEY", "")
    if dgov_key:
        logger.info("✅ DATA_GOV_API_KEY loaded from environment.")
    else:
        logger.warning("⚠️  DATA_GOV_API_KEY not set — live Kerala data unavailable.")

    logger.info("⏳ Training Hybrid AI Price Engine (Prophet + LSTM) …")
    predictor.train(lstm_epochs=10)
    logger.info("✅ Model training complete — API is ready.")
    logger.info("🔑 RSA-2048 key-pair generated (in-memory).")
    yield
    logger.info("🛑 Shutting down AgroStack API.")


# ── FastAPI App ──────────────────────────────────────────────────────

app = FastAPI(
    title="AgroStack — Kerala AI Price Engine",
    description=(
        "Kerala-specific crop price prediction. Live mandi data from "
        "Data.gov.in (Agmarknet) fused with a Prophet seasonality model "
        "(70 %) and TensorFlow LSTM shock model (30 %). "
        "Every prediction is RSA-PSS signed for smart-contract integrity."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    """Health-check / welcome endpoint."""
    return {
        "service": "AgroStack Kerala AI Price Engine",
        "version": "2.0.0",
        "state": "Kerala",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/predict/{crop_id}", tags=["Prediction"])
async def predict(crop_id: str):
    """Return a Kerala-specific hybrid price prediction.

    **Flow**

    1. Fetch live Kerala mandi prices via ``LivePriceInformer``
    2. If 0 records → return a clear JSON error
    3. Apply AI engine: ``predicted = current × (Prophet_mult × 0.7 + LSTM_mult × 0.3)``
    4. RSA-PSS sign the entire payload

    **Response fields**

    | Field              | Description                                      |
    |--------------------|--------------------------------------------------|
    | `crop_id`          | Normalised crop identifier                       |
    | `current_price`    | Live Kerala avg modal price (₹/quintal)          |
    | `predicted_price`  | 30-day AI forecast                               |
    | `market_summary`   | Aggregated Kerala market stats                   |
    | `insights`         | Natural-language explanation                     |
    | `attribution`      | XAI dict (weights, shock factor, anomaly)        |
    | `signature`        | RSA-PSS hex signature over the payload           |
    """
    crop_name = crop_id.strip().title()

    # 1. Fetch live Kerala mandi data
    market_data = await live_informer.fetch(crop_id)

    # 2. No records → clear JSON error
    if market_data["record_count"] == 0:
        return {
            "error": True,
            "message": f"No active Mandi records for {crop_name} in Kerala today.",
            "crop_id": crop_id.lower(),
            "crop_name": crop_name,
            "state": "Kerala",
            "source": "data.gov.in",
            "source_timestamp": dt.datetime.utcnow().isoformat() + "Z",
        }

    current_price = market_data["avg_modal"]

    # 3. AI prediction (multiplier-based on live base price)
    try:
        prediction = predictor.predict_hybrid(
            crop_id=crop_id.lower(),
            current_price=current_price,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # 4. Build signable payload
    source_timestamp = dt.datetime.utcnow().isoformat() + "Z"

    market_summary = {
        "avg_modal": market_data["avg_modal"],
        "min_price": market_data["min_price"],
        "max_price": market_data["max_price"],
        "record_count": market_data["record_count"],
        "markets": market_data["markets"],
        "districts": market_data["districts"],
    }

    payload = {
        "crop_id": prediction["crop_id"],
        "crop_name": prediction["crop_name"],
        "state": "Kerala",
        "current_price": prediction["current_price"],
        "predicted_price": prediction["predicted_price"],
        "prophet_trend": prediction["prophet_trend"],
        "prophet_multiplier": prediction["prophet_multiplier"],
        "lstm_correction": prediction["lstm_correction"],
        "lstm_multiplier": prediction["lstm_multiplier"],
        "prophet_weight": prediction["prophet_weight"],
        "lstm_weight": prediction["lstm_weight"],
        "insights": prediction["insights"],
        "attribution": {
            **prediction["attribution"],
            "data_source": "Agmarknet_Kerala_Live",
        },
        "market_summary": market_summary,
        "source_timestamp": source_timestamp,
    }

    # 5. RSA-PSS sign
    signature = signer.sign(payload)

    return {
        **payload,
        "signature": signature,
    }


@app.get("/analytics", tags=["Analytics"])
async def analytics():
    """Return model analytics: confidence score, shock alerts, and metadata.

    A **shock alert** is raised when the absolute deviation between the
    Prophet trend and the LSTM correction exceeds **15 %**, signalling
    unusual short-term volatility that may indicate supply-chain disruptions,
    weather events, or demand spikes.
    """
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
    """Export the RSA public key (PEM) for signature verification.

    Smart-contract or downstream consumers can use this key to
    independently verify the ``signature`` attached to every
    ``/predict`` response.
    """
    return {
        "algorithm": "RSA-PSS / SHA-256",
        "key_format": "PEM",
        "public_key": signer.export_public_key_pem(),
    }
