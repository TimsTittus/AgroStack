# AgroStack — Kottayam Agronomic Expert System (v3.0.0)

AgroStack is a weather-aware crop price prediction engine optimized for **Kottayam District, Kerala**. It combines hybrid AI (Prophet + LSTM) with an **Agronomic Expert System** that evaluates biological risks in real-time.

## Key Features

- **Hybrid AI Core**: Fuses Meta Prophet (seasonality) and TensorFlow LSTM (shocks).
- **Agronomic Advisor**: A 25-crop knowledge base that triggers supply-shock multipliers based on live weather thresholds.
- **Real-Time Data**:
  - **Mandi**: Live Kerala price records from [Data.gov.in](https://data.gov.in) (Agmarknet).
  - **Weather**: Live Kottayam conditions (Temp, Humidity, Wind, Rain) from [Open-Meteo](https://open-meteo.com).
- **Cryptographic Integrity**: Every prediction is **RSA-PSS signed** to ensure an immutable audit trail for smart-contract consumption.

## Architecture

1. **`main.py`**: API layer (FastAPI) handling parallel data fetching and RSA signing.
2. **`engine.py`**: The AI/Expert brain hosting `HybridPredictor` and `AgronomicAdvisoryLayer`.
3. **`data_manager.py`**: Data pipeline including `LivePriceInformer` and `WeatherClient`.

## Setup

1. **Environment**:
   ```bash
   # Create a .env file with your Data.gov.in API Key
   DATA_GOV_API_KEY=your_key_here
   ```

2. **Run**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## API Endpoints

- `GET /predict/{crop_id}`: Returns a signed payload with `predicted_price`, `biological_risk_alert`, `advisory`, and `weather_snapshot`.
- `GET /analytics`: Model confidence, shock alerts, and training metadata.
- `GET /public-key`: RSA public key (PEM) for signature verification.

## Crops Covered (25)

Rubber, Black Pepper, Cardamom, Coffee Robusta, Tea, Arecanut, Cashew, Paddy, Rice, Tapioca, Yam, Sweet Potato, Banana, Pineapple, Jackfruit, Mango, Papaya, Ginger, Turmeric, Nutmeg, Cocoa, Clove, Vanilla, Betel Leaf, Cinnamon, Garlic, Coconut.

---
*AgroStack: Bridging Agronomic Expertise and Predictive Finance*