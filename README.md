# CyberStream

Real-time Big Data cybersecurity event monitoring and **rule-based / CEP** threat detection platform with a batch analytics workflow. No machine learning — every alert is deterministic and explainable.

```
SYNTHETIC CSV ─→ SPARK BATCH ETL ─→ HDFS/PARQUET ─→ HIVE/HiveQL ─→ RStudio GRAPHS
KAFKA ─────────→ SPARK STRUCTURED STREAMING ────────┘
                                                       → FASTAPI → REACT SOC DASHBOARD
```

## Project Overview
CyberStream ingests a continuous stream of normalized security events, processes them with
Spark Structured Streaming, applies windowed Complex Event Processing rules, stores results in
hot (PostgreSQL) and cold (HDFS Parquet, partitioned by `event_date`) storage, and streams live
detections to a professional Security Operations Center dashboard over WebSockets.

## Technology Stack
- **Streaming:** Apache Kafka (topics: `cyber-events`, `normalized-events`, `security-alerts`, `system-events`)
- **Processing:** Apache Spark Structured Streaming (PySpark), tumbling/sliding windows, watermarks
- **Detection:** Deterministic CEP rule engine (8 rules), explainable severity engine
- **Storage and analytics:** Hadoop HDFS, partitioned Parquet, Apache Hive/HiveQL
- **Visualization:** RStudio / R scripts, plus the existing React SOC dashboard
- **Hot storage:** PostgreSQL
- **Backend:** Python, FastAPI, WebSockets, OpenAPI
- **Frontend:** React, Tailwind CSS, Framer Motion, Recharts, D3.js

## Features
- Real-time event ingestion at 10 / 100 / 500 / 1000 events/sec
- Reproducible generator for million-row synthetic cybersecurity datasets
- Spark batch ETL and Kafka replay, with partitioned Parquet data in HDFS
- Hive external tables, HiveQL analysis, and RStudio-ready plots/architecture diagram
- 8 CEP detection rules (see `DETECTION_RULES.md`)
- Live SOC dashboard: Overview, Live Events, Threats, Analytics, Network Map (D3), Rules, System Health
- Attack simulator (brute force, port scan, DDoS burst, SSH attack, data exfiltration, multi-stage)
- Incident correlation + investigation drawer with evidence and recommended steps
- RBAC (ADMIN / ANALYST / VIEWER) with JWT auth
- One-click **Project Export** (downloads the full source as a ZIP)

## Installation / Docker setup
```bash
cp .env.example .env      # fill in JWT_SECRET, ADMIN_PASSWORD, etc.
docker compose --profile bda up --build
```
Frontend: http://localhost:3000 · API: http://localhost:8001 · API docs: http://localhost:8001/docs

**Resource requirements:** the full stack adds HDFS, Hive, and RStudio to Kafka, Spark, and the
application; allow roughly 8 GB RAM and sufficient disk space for Docker images and generated data.

### Big Data Analytics workflow

See [BDA.md](BDA.md) for the complete Windows PowerShell workflow, data generation, HiveQL queries,
Kafka replay, and RStudio graph steps. One command generates a one-million-row dataset and runs
Spark batch ETL:

```powershell
.\scripts\run-bda.ps1 -Rows 1000000 -Days 30
```

Dashboard: http://localhost:3000 · HDFS: http://localhost:9870 · RStudio: http://localhost:8787

### Development mode (lightweight)
The reference deployment runs an **in-process pipeline** (producer → stream processor → CEP engine
→ storage → WebSocket) inside the FastAPI backend, mirroring the Kafka/Spark topology without the
heavy infrastructure. This is what powers the live preview and needs only backend + frontend + DB.

## Demo
```bash
./scripts/demo.sh
```
See `DEMO.md`. Watch a single event travel EVENT → KAFKA → SPARK → RULE → ALERT → DB → WEBSOCKET → DASHBOARD.

## Detection Rules
BRUTE_FORCE · PORT_SCAN · DISTRIBUTED_BRUTE_FORCE · DATA_EXFILTRATION · AUTHENTICATION_ANOMALY ·
SSH_ATTACK · DNS_ANOMALY · MULTI_STAGE_ATTACK. Details in `DETECTION_RULES.md`.

## Screenshots
_Add SOC dashboard screenshots here._

## Downloaded Project
This archive contains the complete CyberStream source code.

### Requirements
- Docker, Docker Compose, Python 3.11+, Node.js 18+

### Start
```bash
docker compose --profile bda up --build
```
Then open the frontend at http://localhost:3000 and the API at http://localhost:8001.

## Project Limitations
- Events are synthetic (generated), but they travel the real pipeline and trigger real detections.
- The live preview uses the in-process pipeline; the Kafka/Spark stack is provided for full local deployment.
- Geo coordinates are approximate/synthetic and are not claimed to be precise.

## Future Work
- Real log-source connectors (syslog, Zeek, Suricata, cloud audit logs)
- Real log-source connectors (syslog, Zeek, Suricata, cloud audit logs)
- Multi-node production HDFS, secure Hive metastore, and cloud object-storage deployment
- Alert notification integrations and SOAR playbook automation

## Documentation
ARCHITECTURE.md · API.md · BDA.md · KAFKA.md · SPARK.md · DETECTION_RULES.md · DATABASE.md · DEPLOYMENT.md · TESTING.md · DEMO.md
