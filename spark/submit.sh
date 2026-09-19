#!/bin/bash
spark-submit \
  --master local[*] \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0,org.postgresql:postgresql:42.7.1 \
  --conf spark.sql.streaming.forceDeleteTempCheckpointLocation=true \
  /opt/spark-apps/jobs/streaming_job.py
