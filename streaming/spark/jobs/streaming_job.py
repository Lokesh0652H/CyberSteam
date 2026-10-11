"""Spark Structured Streaming job: Kafka -> parse -> normalize -> enrich ->
watermark -> windowed CEP detection -> PostgreSQL (hot) + Parquet (cold) + alerts topic.
"""
import os
from urllib.parse import unquote, urlsplit

from pyspark.sql import SparkSession
from pyspark.sql.functions import (col, from_json, to_date, to_json, to_timestamp, window,
                                    count, sum as _sum, approx_count_distinct, expr, lit,
                                    current_timestamp)

from schemas.event_schema import EVENT_SCHEMA
from rules.cep_rules import brute_force, port_scan, data_exfiltration

BROKER = os.environ.get("KAFKA_BROKER", "kafka:29092")
DB_URL = os.environ.get("DATABASE_URL", "postgresql://cyberstream:cyberstream@postgres:5432/cyberstream")
COLD = os.environ.get(
    "HDFS_URL", "hdfs://namenode:9000/user/cyberstream/events/stream"
)
CHECKPOINT = os.environ.get(
    "CHECKPOINT_URL", "hdfs://namenode:9000/user/cyberstream/checkpoints/streaming"
)


def build_spark():
    return (SparkSession.builder
            .appName("CyberStreamCEP")
            .config("spark.sql.streaming.checkpointLocation", CHECKPOINT)
            .config("spark.sql.shuffle.partitions", "6")
            .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000")
            .config("spark.hadoop.dfs.client.use.datanode.hostname", "true")
            .getOrCreate())


def read_stream(spark):
    raw = (spark.readStream.format("kafka")
           .option("kafka.bootstrap.servers", BROKER)
           .option("subscribe", "cyber-events")
           .option("startingOffsets", "latest")
           .option("failOnDataLoss", "false")
           .load())
    parsed = (raw.select(from_json(col("value").cast("string"), EVENT_SCHEMA).alias("e"))
              .select("e.*")
              .filter(col("event_id").isNotNull()))          # drop malformed
    return parsed.withColumn("ts", to_timestamp("timestamp")).withWatermark("ts", "2 minutes")


def write_cold(df):
    event_columns = [
        to_json(col("metadata")).alias("metadata")
        if field == "metadata"
        else col(field)
        for field in EVENT_SCHEMA.fieldNames()
    ]
    cold_events = (
        df.select(*event_columns, to_date("ts").cast("string").alias("event_date"))
    )
    return (cold_events.writeStream.format("parquet")
            .option("path", COLD)
            .option("checkpointLocation", f"{CHECKPOINT}/cold-events")
            .partitionBy("event_date")
            .outputMode("append").start())


def write_alerts_to_pg(batch_df, _):
    database_url = urlsplit(DB_URL)
    if database_url.scheme not in ("postgres", "postgresql") or not database_url.hostname:
        raise ValueError("DATABASE_URL must be a valid postgresql:// connection URL")

    jdbc_options = {
        "url": (
            f"jdbc:postgresql://{database_url.hostname}:"
            f"{database_url.port or 5432}{database_url.path}"
        ),
        "dbtable": "alerts",
        "driver": "org.postgresql.Driver",
    }
    if database_url.username:
        jdbc_options["user"] = unquote(database_url.username)
    if database_url.password:
        jdbc_options["password"] = unquote(database_url.password)

    (batch_df.write.format("jdbc")
     .options(**jdbc_options)
     .mode("append").save())


def main():
    spark = build_spark()
    spark.sparkContext.setLogLevel("WARN")
    events = read_stream(spark)

    write_cold(events)

    # windowed CEP detections (see rules/cep_rules.py for thresholds)
    alerts = brute_force(events).unionByName(port_scan(events)).unionByName(data_exfiltration(events))
    (alerts.writeStream.foreachBatch(write_alerts_to_pg).outputMode("update").start())

    # live alert stream back to Kafka for the WebSocket bridge
    (alerts.selectExpr("to_json(struct(*)) AS value")
     .writeStream.format("kafka")
     .option("kafka.bootstrap.servers", BROKER)
     .option("topic", "security-alerts").outputMode("update").start())

    spark.streams.awaitAnyTermination()


if __name__ == "__main__":
    main()
