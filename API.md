# API

Base URL: `http://localhost:8001`. Interactive OpenAPI docs at `/docs`. All routes are prefixed `/api`.
Authentication: `Authorization: Bearer <JWT>` (obtained from `/api/auth/login`).

## Auth
- `POST /api/auth/login` → `{ token, user }`
- `GET  /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/register` (ADMIN)
- `GET  /api/auth/users` (ADMIN)

## Events
- `GET /api/events?q=&severity=&event_type=&source_ip=&sort=&order=&page=&page_size=`
- `GET /api/events/{event_id}`
- `GET /api/events/history/cold?limit=&event_type=&source_ip=` (Parquet cold storage)

## Alerts / Incidents
- `GET /api/alerts?severity=&rule=&page=&page_size=` · `GET /api/alerts/{alert_id}`
- `GET /api/incidents?status=` · `GET /api/incidents/{incident_id}`
- `PUT /api/incidents/{incident_id}/status?status=` (ANALYST/ADMIN)

## Statistics / Analytics
- `GET /api/statistics` · `GET /api/statistics/timeline?points=`
- `GET /api/analytics/summary` · `GET /api/network/graph` · `GET /api/hosts`

## Rules
- `GET /api/rules` · `PUT /api/rules/{rule_id}` (ADMIN) — body `{ enabled?, threshold?, window_seconds? }`

## System
- `GET /api/system/health` · `GET /api/system/metrics`

## Simulator (ANALYST/ADMIN)
- `POST /api/simulator/start` `{ rate?, scenario? }` · `POST /api/simulator/stop`
- `POST /api/simulator/scenario` `{ scenario }` · `POST /api/simulator/rate` `{ rate }`
- `GET  /api/simulator/status`

## Project export (ANALYST/ADMIN)
- `GET /api/project/export?mode=complete|source|docs` → streams `cyberstream-project.zip`
- `GET /api/project/export/size?mode=`

## WebSocket
- `GET /api/ws` — streams `{ type: "event"|"alert"|"incident"|"metrics", data }`
