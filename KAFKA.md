# Kafka

## Topics
| Topic | Partitions | Purpose |
|-------|-----------|---------|
| `cyber-events` | 6 | Raw normalized events from producers |
| `normalized-events` | 6 | Post-validation/enrichment stream |
| `security-alerts` | 3 | CEP rule matches for the WebSocket bridge |
| `system-events` | 1 | Pipeline/system telemetry |

## Producer configuration
- JSON serialization, keyed by `source_ip` (per-source events share a partition → correct windowing)
- `acks=all`, `retries=5`, `enable_idempotence=true`, `linger_ms=20`
- Configurable rate via `EVENT_RATE` (10/100/500/1000 events/sec)

## Consumer configuration
- Spark reads with `startingOffsets=latest`, `failOnDataLoss=false`
- Consumer groups isolate the streaming job from the WebSocket bridge

## Operations
```bash
kafka-topics --bootstrap-server localhost:9092 --list
kafka-console-consumer --bootstrap-server localhost:9092 --topic security-alerts --from-beginning
```
