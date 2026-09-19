# CyberSteam

# Distributed Cybersecurity Event Analytics & Real-Time Monitoring Platform (Big Data Analytics)

CyberSteam is an enterprise-grade Big Data streaming analytics platform engineered specifically for real-time cybersecurity event processing, sliding-window threat detection, and interactive security incident visualization.

## 🚀 Key Features

- **High-Throughput Stream Ingestion**: Decoupled event ingestion via **Apache Kafka** partitioned topic streams (`cyber-events`, `authentication-events`, `http-events`, `firewall-events`).
- **Distributed Stream Processing**: Micro-batch analytics & sliding-window detection powered by **Apache Spark Structured Streaming** and an asynchronous **Complex Event Processing (CEP)** rule engine.
- **Dual-Tier Storage Strategy**:
  - **Cold Tier**: Long-term archival of high-volume columnar data on **HDFS** partitioned in **Apache Parquet**.
  - **Hot Tier**: Low-latency indexed relational storage on **PostgreSQL / SQLite** for active alert triage and telemetry.
- **Real-Time SOC Dashboard**: Interactive Security Operations Center (SOC) single-page application built with **React 18**, **Vite**, **Tailwind CSS**, and **WebSockets (RFC 6455)** for sub-50ms push updates.
- **Red Team Attack Simulation Suite**: Built-in interactive attack scenario triggers (Brute Force, DDoS, Port Scan, Server Error spikes).
- **Target Banking Web Application**: Simulated victim web portal (*Apex Global Banking*) to demonstrate live attacks and instantaneous SOC alert generation.
- **Explainable & Deterministic Security**: Zero black-box ML/NLP models—fully explainable deterministic rules compliant with NIST SP 800-61 and PCI-DSS audit standards.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Message Broker** | Apache Kafka 3.5, Zookeeper |
| **Stream Processing** | Apache Spark Structured Streaming 3.5, Python Asyncio CEP |
| **Storage & Data Lake** | HDFS, Apache Parquet, PostgreSQL 15, SQLite 3 |
| **Backend API Gateway** | FastAPI (Python 3.11), Uvicorn, SQLAlchemy, Pydantic v2 |
| **Streaming Protocol** | WebSockets (RFC 6455) |
| **Frontend SOC App** | React 18, Vite, Recharts, Leaflet (Carto Dark Maps), Lucide Icons |
| **Security & Auth** | JWT (JSON Web Tokens), OAuth2, PBKDF2 Password Hashing |

## 🏗️ Architecture

```
[ External Adversary / Attack Simulator ]
                  │
                  ▼
   [ Target Application: Apex Banking Portal ]
                  │
                  ▼ (Telemetry Forwarding)
       [ Apache Kafka Message Broker ]
                  │  ├── Topic: cyber-events
                  │  ├── Topic: authentication-events
                  │  ├── Topic: http-events
                  │  └── Topic: firewall-events
                  │
     ┌────────────┴────────────────────────┐
     ▼                                     ▼
[ Apache Spark Streaming Engine ]     [ FastAPI Event Ingest Bus ]
     │ (Micro-batching & Watermarking)     │ (Sliding-Window CEP Rule Engine)
     │                                     │
     ├──────────────────┐                  ├────────────────────────┐
     ▼                  ▼                  ▼                        ▼
[ HDFS Parquet ]  [ PostgreSQL DB ]  [ Security Alerts DB ]   [ WebSockets Push ]
(Cold Storage)    (Active Store)    (Incident Management)   (ws://.../ws/events)
                                                                    │
                                                                    ▼
                                                       [ CyberStream React SOC ]
```

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m app.db.seed  # Seed initial rules, servers, and users
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Event Generator Setup
```bash
cd event-generator
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit the dashboard at `http://localhost:5173/` and the target banking demo at `http://localhost:5173/target-app`.

## 📜 License
MIT License
