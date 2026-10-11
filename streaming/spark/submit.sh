#!/usr/bin/env bash
set -euo pipefail
# Submit the CyberStream Spark Structured Streaming job with Kafka + PostgreSQL deps.
cd "$(dirname "$0")"
export PYTHONPATH="$(pwd):${PYTHONPATH:-}"
exec spark-submit \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1,org.postgresql:postgresql:42.7.3 \
  jobs/streaming_job.py
