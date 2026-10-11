#!/usr/bin/env bash
set -euo pipefail
# CyberStream one-command demo.
#   1. Start infra (Kafka, Postgres)  2. Producer  3. Spark  4. Backend  5. Frontend
#   6. Normal traffic  7. Attack scenarios  8. Detections appear live on the dashboard.

echo "==> Starting CyberStream stack (docker compose up --build)"
docker compose up --build -d

echo "==> Waiting for services to become healthy..."
sleep 25

echo "==> Generating normal baseline traffic (producer already running at EVENT_RATE)"
sleep 5

echo "==> Injecting attack scenarios through Kafka -> Spark -> CEP"
docker compose exec -T producer python -m simulator.simulator brute_force || true
docker compose exec -T producer python -m simulator.simulator port_scan || true
docker compose exec -T producer python -m simulator.simulator multi_stage || true

echo ""
echo "CyberStream is live:"
echo "  Dashboard : http://localhost:3000"
echo "  API docs  : http://localhost:8001/docs"
echo ""
echo "Watch the SOC dashboard: EVENT -> KAFKA -> SPARK -> RULE -> ALERT -> DB -> WEBSOCKET -> UI"
