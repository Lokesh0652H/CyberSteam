"""Transform the generated CSV dataset to partitioned Parquet in HDFS."""

import os

from pyspark.sql import SparkSession
from pyspark.sql.functions import to_date, to_timestamp
from pyspark.sql.types import (
    DoubleType,
    IntegerType,
    LongType,
    StringType,
    StructField,
    StructType,
)


INPUT = os.environ.get("BATCH_INPUT", "/data/bda/input/cyber_events.csv")
OUTPUT = os.environ.get(
    "BATCH_HDFS_URL",
    "hdfs://namenode:9000/user/cyberstream/events/batch",
)
EVENT_SCHEMA = StructType(
    [
        StructField("event_id", StringType(), False),
        StructField("timestamp", StringType(), False),
        StructField("source_ip", StringType(), True),
        StructField("destination_ip", StringType(), True),
        StructField("source_port", IntegerType(), True),
        StructField("destination_port", IntegerType(), True),
        StructField("protocol", StringType(), True),
        StructField("event_type", StringType(), True),
        StructField("action", StringType(), True),
        StructField("bytes", LongType(), True),
        StructField("packets", IntegerType(), True),
        StructField("username", StringType(), True),
        StructField("device_id", StringType(), True),
        StructField("country", StringType(), True),
        StructField("latitude", DoubleType(), True),
        StructField("longitude", DoubleType(), True),
        StructField("severity", StringType(), True),
        StructField("metadata", StringType(), True),
    ]
)


def main() -> None:
    spark = (
        SparkSession.builder.appName("CyberStreamBatchETL")
        .config("spark.hadoop.dfs.client.use.datanode.hostname", "true")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")
    events = (
        spark.read.option("header", True)
        .schema(EVENT_SCHEMA)
        .csv(INPUT)
        .filter("event_id IS NOT NULL AND timestamp IS NOT NULL")
        .withColumn("event_date", to_date(to_timestamp("timestamp")).cast("string"))
    )
    count = events.count()
    if count == 0:
        raise RuntimeError(f"No valid event rows found in {INPUT}")

    (
        events.write.mode("overwrite")
        .format("parquet")
        .option("compression", "snappy")
        .partitionBy("event_date")
        .save(OUTPUT)
    )
    print(f"Processed {count:,} events into partitioned Parquet at {OUTPUT}.")
    spark.stop()


if __name__ == "__main__":
    main()
