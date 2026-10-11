# Detection Rules (CEP — deterministic, no ML)

Every rule is a windowed aggregation with a threshold. Each alert stores: `rule`, `threshold`,
`observed`, `window`, `severity`, `evidence`, `timestamp`.

| # | Rule | Trigger | Default threshold | Window | Base severity |
|---|------|---------|-------------------|--------|---------------|
| 1 | BRUTE_FORCE | Failed auth from one source IP → one destination | ≥ 5 | 60s | high |
| 2 | PORT_SCAN | One source IP → many distinct destination ports | ≥ 15 ports | 30s | high |
| 3 | DISTRIBUTED_BRUTE_FORCE | Many distinct source IPs → same account/server | ≥ 8 sources | 90s | critical |
| 4 | DATA_EXFILTRATION | Large outbound byte volume from one source | ≥ 5 MB | 60s | critical |
| 5 | AUTHENTICATION_ANOMALY | failed → failed → success sequence from one source | ≥ 2 fails before success | 45s | medium |
| 6 | SSH_ATTACK | Repeated SSH (port 22) attempts from one source | ≥ 10 | 60s | high |
| 7 | DNS_ANOMALY | High-frequency DNS queries from one source | ≥ 20 | 30s | medium |
| 8 | MULTI_STAGE_ATTACK | recon → auth attempts → success → exfiltration (ordered) | ≥ 4 stages | 180s | critical |

## Severity engine
Base severity per rule, escalated deterministically by how far the observed value exceeds the
threshold: `ratio ≥ 1.8` → +1 level, `ratio ≥ 3` → +2 levels (clamped LOW..CRITICAL). This makes
every severity explainable from `(observed, threshold)`.

Example alert:
```json
{ "rule": "BRUTE_FORCE", "threshold": 5, "observed": 17, "window": "60 seconds", "severity": "critical",
  "evidence": { "failed_attempts": 17, "target_user": "root" } }
```

Rules are configurable at runtime (enable/disable, threshold, window) via `PUT /api/rules/{id}`,
persisted in PostgreSQL and hot-reloaded into the engine.
