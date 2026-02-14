"""
simulation_engine.py — AgroStack What-If Profit Simulator
==========================================================
A fully independent, deterministic simulation module for the farmer
dashboard.  No ML, no RSA signing, no interference with the core
prediction pipeline.

Route
-----
GET /simulate/{crop_id}
    Accepts slider-driven parameters (rainfall, market-price, land size,
    costs) and returns a real-time profit simulation.

Architecture
------------
1. **Pydantic models** — strict input validation + serialization
2. **Pure calculation core** — ``run_simulation()`` with zero side effects
3. **Router factory** — ``create_simulation_router()`` returns a mounted
   ``APIRouter`` that only needs a ``LivePriceInformer`` reference
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import BaseModel, Field

logger = logging.getLogger("agrostack.simulation")

# Constants

BASE_YIELD: float = 1000.0        # Default yield (units) when crop-specific data unavailable
FALLBACK_PRICE: float = 2000.0    # ₹/quintal fallback when no live mandi data exists
RAINFALL_SENSITIVITY: float = 0.5 # Rainfall → yield linear sensitivity coefficient


# Pydantic Models

class SimulationInputs(BaseModel):
    """Validated slider parameters coming from the farmer dashboard."""

    rainfall_percent: float = Field(
        ..., ge=-100.0, le=100.0,
        description="Rainfall adjustment from slider (−100 to +100 %).",
    )
    market_price_percent: float = Field(
        ..., ge=-100.0, le=100.0,
        description="Market-price adjustment from slider (−100 to +100 %).",
    )
    land_size: float = Field(
        ..., ge=0.0,
        description="Land size in acres.",
    )
    fertilizer_cost: float = Field(
        ..., ge=0.0,
        description="Monthly fertilizer cost (₹).",
    )
    labour_cost: float = Field(
        ..., ge=0.0,
        description="Monthly labour cost (₹).",
    )


class SimulationResult(BaseModel):
    """Structured response returned to the frontend."""

    crop_id: str
    inputs: Dict[str, float]
    simulation: Dict[str, float]
    status: str = "success"


# Calculation Core 

def run_simulation(
    base_price: float,
    inputs: SimulationInputs,
) -> Dict[str, float]:
    """Execute the deterministic profit-simulation formula.

    Parameters
    ----------
    base_price : float
        Live mandi average modal price (₹/quintal).
    inputs : SimulationInputs
        Validated slider parameters.

    Returns
    -------
    Dict[str, float]
        All intermediate + final values for full transparency.
    """
    adjusted_price = base_price * (1 + inputs.market_price_percent / 100)

    rainfall_factor = 1 + (inputs.rainfall_percent / 100 * RAINFALL_SENSITIVITY)
    adjusted_yield = BASE_YIELD * rainfall_factor

    total_cost = inputs.fertilizer_cost + inputs.labour_cost
    gross_revenue = adjusted_price * adjusted_yield * inputs.land_size
    predicted_profit = gross_revenue - total_cost

    return {
        "base_price": round(base_price, 2),
        "adjusted_price": round(adjusted_price, 2),
        "rainfall_factor": round(rainfall_factor, 4),
        "adjusted_yield": round(adjusted_yield, 2),
        "gross_revenue": round(gross_revenue, 2),
        "total_cost": round(total_cost, 2),
        "predicted_profit": round(predicted_profit, 2),
    }


# Router Factory

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
            ...,
            description="Crop identifier (e.g. rubber, coconut, rice).",
        ),
        rainfall_percent: float = Query(
            0.0,
            ge=-100.0,
            le=100.0,
            description="Rainfall adjustment % from slider (−100 to +100).",
        ),
        market_price_percent: float = Query(
            0.0,
            ge=-100.0,
            le=100.0,
            description="Market-price adjustment % from slider (−100 to +100).",
        ),
        land_size: float = Query(
            1.0,
            ge=0.0,
            description="Land size in acres.",
        ),
        fertilizer_cost: float = Query(
            0.0,
            ge=0.0,
            description="Monthly fertilizer cost (₹).",
        ),
        labour_cost: float = Query(
            0.0,
            ge=0.0,
            description="Monthly labour cost (₹).",
        ),
    ) -> Dict[str, Any]:
        """Run a What-If profit simulation for a given crop.

        All parameters come from frontend sliders.  The calculation is
        purely deterministic — no ML models, no RSA signing.
        """
        # ── 1. Validate & pack inputs ──────────────────────────
        try:
            inputs = SimulationInputs(
                rainfall_percent=rainfall_percent,
                market_price_percent=market_price_percent,
                land_size=land_size,
                fertilizer_cost=fertilizer_cost,
                labour_cost=labour_cost,
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        # 2. Fetch live base price
        try:
            market_data = await live_informer.fetch(crop_id)
            base_price = (
                market_data["avg_modal"]
                if market_data["record_count"] > 0
                else FALLBACK_PRICE
            )
        except Exception as exc:
            logger.warning(
                "Live price fetch failed for '%s', using fallback: %s",
                crop_id, exc,
            )
            base_price = FALLBACK_PRICE

        # 3. Run deterministic simulation
        try:
            simulation = run_simulation(base_price, inputs)
        except Exception as exc:
            logger.error("Simulation calculation error: %s", exc)
            raise HTTPException(
                status_code=500,
                detail="Internal simulation error. Please try again.",
            )

        # 4. Build response
        return SimulationResult(
            crop_id=crop_id.lower(),
            inputs={
                "rainfall_percent": inputs.rainfall_percent,
                "market_price_percent": inputs.market_price_percent,
                "land_size": inputs.land_size,
                "fertilizer_cost": inputs.fertilizer_cost,
                "labour_cost": inputs.labour_cost,
            },
            simulation=simulation,
        ).model_dump()

    return router
