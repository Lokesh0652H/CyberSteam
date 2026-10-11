# Database

## Hot storage — PostgreSQL
Relational schema (see `backend/app/database/` migrations in the full deployment):

- **events**(event_id PK, timestamp, source_ip, destination_ip, source_port, destination_port,
  protocol, event_type, action, bytes, packets, username, device_id, country, lat, lon, severity)
  — indexes on (timestamp), (severity), (source_ip)
- **alerts**(alert_id PK, rule, rule_name, severity, source, target, threshold, observed, window,
  evidence JSONB, timestamp, incident_id FK) — indexes on (timestamp), (rule)
- **attack_incidents**(incident_id PK, attack_type, severity, source, target, first_seen, last_seen,
  status, alert_count, evidence JSONB) — index on (status), (last_seen)
- **hosts**(host PK, event_count, alert_count, last_event, last_ip)
- **rules**(id PK, name, description, enabled, threshold, window_seconds, base_severity, matches)
- **system_metrics**(ts, events_received, events_processed, events_rejected, alerts_generated,
  events_per_sec, detection_latency_ms)

Retention: `events` are trimmed to a rolling hot window (recent N); older data lives in cold storage.

## Cold storage — Parquet (HDFS-compatible)
```
data/events/year=2026/month=09/day=27/hour=15/events_*.parquet
```
Historical queries read matching partitions. In development the target is the local filesystem
(`file:///data/events`); in production point `HDFS_URL` at an HDFS/S3 path.

## Live environment note
The reference preview uses MongoDB collections mirroring the tables above (`events`, `alerts`,
`attack_incidents`, `hosts`, `rules`, `system_metrics`, `users`) as hot storage, with the same
Parquet cold tier.
