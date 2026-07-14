# AgroStack 🌴

```text
 █████╗  ██████╗ ██████╗  ██████╗ ███████╗████████╗ █████╗  ██████╗ ██╗  ██╗
██╔══██╗██╔════╝ ██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝██╔══██╗██╔════╝ ██║ ██╔╝
███████║██║  ███╗██████╔╝██║   ██║███████╗   ██║   ███████║██║      █████╔╝ 
██╔══██║██║   ██║██╔══██╗██║   ██║╚════██║   ██║   ██╔══██║██║      ██╔═██╗ 
██║  ██║╚██████╔╝██║  ██║╚██████╔╝███████║   ██║   ██║  ██║╚██████╗ ██║  ██╗
╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
```

### *🏆 1st Prize Winner — IEDC Cluster Level Agricultural Hackathon*
An award-winning, weather-aware Agronomic Expert System & AI Price Engine optimized for **Kottayam District, Kerala**. AgroStack empowers local farmers by bridging advanced predictive finance, real-time agronomic risk analysis, simulated federated learning, and accessible voice-based IVR systems.

---

## 🚀 Key Innovation Pillars

### 1. Hybrid AI Price Engine & XAI
* **Prophet + LSTM Fusion**: Blends a **Meta Prophet** seasonality model (70% weight) for long-term trends and a **TensorFlow LSTM** residual model (30% weight) to capture short-term price shocks.
  $$\text{Predicted Price} = (\text{Prophet Trend} \times 0.7 + \text{LSTM Residual} \times 0.3) \times \text{Advisory Bias}$$
* **Explainable AI (XAI)**: Quantifies feature attributions, explaining price fluctuations (e.g., rainfall deficits, market demand volatility) in plain language.
* **Cryptographic Integrity**: Predictions are dynamically signed in-memory using **RSA-PSS (2048-bit / SHA-256)**, creating an immutable audit trail for smart-contracts.

### 2. Weather-Aware Agronomic Advisory
* **25-Crop Knowledge Base**: Evaluates live weather against biological thresholds for Kerala crops (Rubber, Black Pepper, Cardamom, Paddy, Coconut, etc.).
* **Dynamic Supply Multipliers**: Triggers supply-shock alerts and bias modifiers if thresholds are breached (e.g., wind speeds $>40\text{ km/h}$ trigger banana lodging alerts; humidity $>85\%$ triggers pepper fungal rot risk).

### 3. Accessible Multi-Channel Communication (Twilio IVR & SMS)
* **Malayalam Voice Portal**: Farmers without active internet access can manage orders through an automated **Twilio Interactive Voice Response (IVR)** system.
* **On-the-Fly Speech Synthesis**:
  * Farmer presses `3` $\rightarrow$ Fetches inventory from Supabase.
  * Summarizes stock metrics using **Groq LLM** in Malayalam.
  * Generates Malayalam audio dynamically via **Murf AI** (`Alicia` voice) and streams it back to the call in real time.
* **SMS & Emails**: Dispatches transaction alerts via automated SMS and templates built with **React Email** & **Nodemailer**.

### 4. Privacy-First Simulated Federated Learning
* **Regional Edge Training**: Trains regional LSTM models (Kottayam, Idukki, Ernakulam) on local price datasets without centralizing raw financial data.
* **FedAvg Optimization**: Implements decentralized federated averaging to build a robust global forecasting model.
* **Optimal Routing Recommendations**: Computes 7-day average predictions to direct farmers to the highest-yielding regional market (e.g., advising a farmer in Kottayam to sell rubber in Idukki for higher returns).

### 5. What-If Profit Simulator
* A deterministic calculator analyzing land size, labor cost, and fertilizer cost against live mandi prices (from **Data.gov.in**) and current weather conditions (from **Open-Meteo**) to guide harvest timing and storage decisions.

### 6. Sarvam AI & Supabase MCP JSON-RPC Server
* An **MCP-compatible API server** exposing secure data-access tools (`push_to_inventory` and `pull_from_inventory`) integrated with **Sarvam AI**'s multilingual LLM calling layer.

---

## 🛠️ The Tech Stack

### Web & API Framework
* **Frontend**: Next.js 15 (App Router), React 19, TypeScript
* **State & Communication**: tRPC (Client & Server) for type-safe endpoints, TanStack React Query
* **Styling & Motion**: Tailwind CSS 4, Radix UI, Framer Motion (`motion/react`)
* **Authentication**: Better Auth (with Drizzle Adapter & cookie security)
* **Database**: Supabase (Postgres), Drizzle ORM

### AI / Data Engineering
* **Machine Learning**: Meta Prophet (cyclical trends), TensorFlow Keras (LSTM sequential modelling & federated simulations)
* **LLM & Speech**: Groq SDK (`gpt-oss-120b`), Murf AI API, Sarvam AI Agent
* **Background Jobs**: Inngest (handles cron tasks like daily automated Facebook page agricultural reports)
* **APIs**: Twilio (SMS & Voice), Data.gov.in (Agmarknet live wholesale price records), Open-Meteo (Real-time weather)
* **Object Storage**: Cloudflare R2 (S3-compatible asset bucket)

---

## 📁 Repository Structure

```
├── AiPriceEngine/             # Python ML Predictor & Simulation Backend
│   ├── engine.py              # Prophet + LSTM Hybrid model & Agronomic Advisory Layer
│   ├── federatedlearning.py   # Simulated Federated Learning & FedAvg pipeline
│   ├── simulation_engine.py   # Farmer What-If simulator (Live Agmarknet + Open-Meteo)
│   ├── sarvamXsupa.py         # MCP JSON-RPC 2.0 server with Sarvam Agent tools
│   └── main.py                # FastAPI server hosting signed prediction endpoints
├── app/                       # Next.js App Router (Dashboard, Farmer & Buyer portals)
│   ├── api/                   # API Routes (tRPC, twilio, stts, auth callbacks)
│   └── page.tsx               # High-fidelity landing page
├── components/                # Shared React UI components
├── db/                        # Drizzle schema definition & migrations
├── inngest/                   # Inngest configurations (daily cron Facebook posters)
├── lib/                       # Server-side helper modules (Twilio, S3/R2, Mailer)
└── trpc/                      # tRPC routers (Inventory, Listings, Orders, Messages)
```

---

## ⚙️ Quick Start

### 1. Configure Environments
Create a `.env` file at the root:
```bash
cp .env.example .env
# Fill in your database, Twilio, Murf, and Groq keys.
```

### 2. Launch the AI engine (Python backend)
```bash
cd AiPriceEngine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Launch the Web App
```bash
# From repository root
bun install   # or npm install
bun dev       # Next.js local development server
```

---
*AgroStack: Revolutionizing agriculture for Kerala’s farmers, one call and prediction at a time.*
