# Big Data Analytics workflow

CyberStream includes a runnable batch-and-stream BDA path in addition to the existing SOC
dashboard:

```text
Synthetic event generator ─┬─> CSV ─> Spark batch ETL ─> HDFS/Parquet ─┐
                           └─> Kafka ─> Spark Structured Streaming ────┤
                                                                      v
                                                    Hive tables + HiveQL queries
                                                                      |
                                                  CSV query results + RStudio charts
```

## Components

- **Kafka** receives the live producer stream (`cyber-events`). The optional replay producer
  sends generated CSV events to the same topic.
- **Spark Structured Streaming** parses Kafka events, runs the existing CEP rules, and writes
  partitioned Parquet files to HDFS.
- **Spark batch ETL** reads the large generated CSV and writes compressed Parquet partitions to
  HDFS. The default example contains one million events; adjust `-Rows` for available memory and
  disk space.
- **Hadoop HDFS** persists both the batch and live datasets under `/user/cyberstream/events`.
- **Apache HiveServer2** exposes external Parquet tables over HDFS. The `.hql` files are HiveQL,
  not illustrative pseudocode.
- **RStudio** reads CSV results exported from HiveQL and creates four analytical charts plus a
  pipeline architecture diagram.

The events are synthetic and intended for coursework and system demonstrations; they do not
represent real users or real network traffic.

## Start and run the batch analysis (Windows PowerShell)

From the project root:

```powershell
docker compose --profile bda up -d --build
.\scripts\run-bda.ps1 -Rows 1000000 -Days 30
```

The first command starts Kafka, Spark, HDFS, HiveServer2, RStudio, and the existing dashboard.
The second generates the data, runs Spark batch ETL, registers/refreshes the Hive tables, exports
query results, and creates the graphs. For a quick smoke run, use `-Rows 10000`.

URLs:

- Dashboard: <http://localhost:3000>
- API: <http://localhost:8001/docs>
- HDFS NameNode UI: <http://localhost:9870>
- HiveServer2: `localhost:10000` (Beeline JDBC)
- RStudio: <http://localhost:8787> (user `rstudio`, default local-demo password `cyberstream`)

The RStudio password can be changed with `RSTUDIO_PASSWORD` in a `.env` file. The default is for
local demonstrations only; do not expose these development services to an untrusted network.

## HiveQL and RStudio

The table definitions and example analytics are in:

- `bda/hive/queries/create_tables.hql`
- `bda/hive/queries/analytics.hql`

After running the workflow, execute `.\scripts\run-hive-analytics.ps1` to export the chart inputs
to `data/bda/results/`. Run `bda/rstudio/analysis.R` in RStudio to create:

- `events_by_severity.png`
- `events_by_hour.png`
- `top_sources.png`
- `events_by_type.png`
- `bda_architecture.png`

The generated CSV and PNG files are intentionally ignored by Git; regenerate them with the
workflow as needed.

## Replay the large file through Kafka

The regular producer continuously sends events to Kafka. To replay the generated file into Kafka
as fast as the broker accepts it:

```powershell
docker compose run --rm --no-deps producer python -m producers.replay_dataset `
  --input /data/bda/input/cyber_events.csv
```

Optionally limit the replay rate, for example `--rate 500` for approximately 500 events/second.
The Kafka consumer starts at the latest offsets, so start the stack (and confirm the Spark service
is running) before replaying. The batch path remains the repeatable way to load the full file into
HDFS for analytics.

## Storage layout

```text
hdfs://namenode:9000/user/cyberstream/events/batch/event_date=YYYY-MM-DD/
hdfs://namenode:9000/user/cyberstream/events/stream/event_date=YYYY-MM-DD/
```

Hive external tables are `cyberstream.cyber_events_batch` and
`cyberstream.cyber_events_stream`; the `cyberstream.cyber_events_all` view unions both sources.
The HDFS, Hive metastore, and existing database data use Docker named volumes.
