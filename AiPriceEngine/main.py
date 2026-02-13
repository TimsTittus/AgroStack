"""
Endpoints
---------
GET /predict/{crop_id}
    Returns hybrid price, Prophet trend, LSTM correction, and a digital
    signature over the payload.

GET /analytics
    Returns confidence score, shock alert, and model metadata.

Run
---
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import json
import datetime as dt
import hashlib
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

from engine import HybridPredictor

logger = logging.getLogger("agrostack")
logging.basicConfig(level=logging.INFO)

# RSA Digital Signature Utility

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
        """Return a hex-encoded RSA signature of the canonical JSON payload.
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

# Application Globals (initialised during lifespan)

predictor: HybridPredictor = HybridPredictor()
signer: RSASigner = RSASigner()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Train the hybrid model on startup using synthetic demo data."""
    logger.info("⏳ Training Hybrid AI Price Engine (Prophet + LSTM) …")
    predictor.train(lstm_epochs=10)
    logger.info("✅ Model training complete — API is ready.")
    yield
    logger.info("🛑 Shutting down AgroStack API.")

# FastAPI

app = FastAPI(
    title="AgroStack — AI Price Engine",
    description=(
        "Crop price prediction powered by a Prophet seasonality model "
        "(70 % weight) fused with a TensorFlow LSTM shock model (30 % weight). "
        "Every prediction is RSA-signed for smart-contract integrity."
    ),
    version="1.0.0",
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
        "service": "AgroStack AI Price Engine",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/predict/{crop_id}", tags=["Prediction"])
async def predict(crop_id: str):
    """Return a hybrid price prediction for the given crop.

    **Response fields**

    | Field              | Description                                   |
    |--------------------|-----------------------------------------------|
    | `hybrid_price`     | Fused price (Prophet × 0.7 + LSTM × 0.3)     |
    | `prophet_trend`    | Prophet 12-month seasonality forecast         |
    | `lstm_correction`  | LSTM 30-day volatility correction             |
    | `insights`         | Natural-language explanation of the prediction|
    | `attribution`      | XAI dict (weights, shock factor, anomaly)     |
    | `digital_signature`| RSA-PSS signature (hex) over the payload      |
    | `timestamp`        | ISO-8601 prediction timestamp                 |
    """
    try:
        prediction = predictor.get_prediction(crop_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # Build signable payload (without the signature itself)
    payload = {
        **prediction,
        "timestamp": dt.datetime.utcnow().isoformat() + "Z",
    }

    # Sign the payload
    digital_signature = signer.sign(payload)

    return {
        **payload,
        "digital_signature": digital_signature,
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
    independently verify the ``digital_signature`` attached to every
    ``/predict`` response.
    """
    return {
        "algorithm": "RSA-PSS / SHA-256",
        "key_format": "PEM",
        "public_key": signer.export_public_key_pem(),
    }
