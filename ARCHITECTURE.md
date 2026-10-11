# Architecture

```
       ┌────────────────┐              ┌─────────────────┐
       │ Synthetic CSV  │              │ Live event feed │
       └───────┬────────┘              └────────┬────────┘
               │                                │
               │                         ┌──────▼──────┐
               │                         │    Kafka    │
               │                         └──────┬──────┘
               │                                │
       ┌───────▼────────┐                ┌──────▼───────────┐
       │ Spark batch ETL│                │ Spark streaming  │
       └───────┬────────┘                │ CEP + checkpoints│
               └───────────────┬────────┴──────────────────┘
                               ▼
                    ┌───────────────────────┐
                    │ HDFS / Parquet         │
                    │ batch + live partitions│
                    └──────────┬────────────┘
                               ▼
                    ┌───────────────────────┐
                    │ Hive external tables  │
                    │ HiveQL + analytics    │
                    └──────────┬────────────┘
                     ┌─────────┴──────────────┐
                     ▼                        ▼
              ┌──────────────┐        ┌────────────────┐
              │ RStudio / R  │        │ FastAPI / React│
              │ charts + flow│        │ SOC dashboard  │
              └──────────────┘        └────────────────┘
```

## Data flow
1. The live producer serializes events to Kafka `cyber-events`, keyed by `source_ip`.
2. Spark Structured Streaming parses the topic, applies a 2-minute watermark, and runs the
   existing windowed CEP rules. Events are persisted as partitioned Parquet in HDFS.
3. An optional replay producer can submit rows from the generated CSV to the same Kafka topic.
4. Spark batch ETL independently processes the million-row CSV and writes Snappy-compressed
   Parquet partitions to HDFS.
5. Hive external tables and the `cyber_events_all` view expose batch and streaming Parquet for
   HiveQL aggregation.
6. Query results are exported as CSV for RStudio charts. FastAPI continues to serve the React SOC
   dashboard and its live preview.

## In-process reference pipeline
`backend/pipeline.py` implements the live preview topology in-process (asyncio queue as the topic,
a consumer as the Spark stage, `detection.py` as the CEP engine) so the platform runs end-to-end
without the heavy infrastructure. See [BDA.md](BDA.md) for the full analytics workflow.
