# Spark Structured Streaming

Job: `streaming/spark/jobs/streaming_job.py`. Submit: `streaming/spark/submit.sh`.

## Pipeline stages
1. **Read** — `kafka` source subscribed to `cyber-events`.
2. **Parse** — `from_json` against `schemas/event_schema.py`; malformed rows (null `event_id`) are dropped.
3. **Normalize/enrich** — cast timestamp, default protocol/bytes, compute base severity.
4. **Watermark** — `withWatermark("ts", "2 minutes")` bounds state for windowed aggregations.
5. **Windowed CEP** — tumbling/sliding windows in `rules/cep_rules.py` (brute force, port scan, exfiltration...).
6. **Sinks** — HDFS Parquet cold storage (partitioned by `event_date`), PostgreSQL `alerts` via
   JDBC `foreachBatch`, and re-publish to the `security-alerts` Kafka topic.

## Large-data batch ETL

`streaming/spark/jobs/batch_job.py` reads `data/bda/input/cyber_events.csv`, validates required
event fields, derives `event_date`, and writes Snappy-compressed Parquet partitions to
`hdfs://namenode:9000/user/cyberstream/events/batch`. The batch dataset is deliberately separate
from the live Kafka stream so that it can be reprocessed reproducibly.

## Fault tolerance
- Streaming checkpoints in HDFS at `/user/cyberstream/checkpoints/streaming`
- `failOnDataLoss=false` tolerates offset gaps
- Malformed events are filtered, never crash the stream

## Submit
```bash
spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1,org.postgresql:postgresql:42.7.3 \
  jobs/streaming_job.py
```
