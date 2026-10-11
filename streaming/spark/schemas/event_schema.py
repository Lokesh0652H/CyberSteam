"""Normalized cybersecurity event schema (shared contract across the pipeline)."""
from pyspark.sql.types import (StructType, StructField, StringType, IntegerType,
                               LongType, DoubleType, MapType)

EVENT_SCHEMA = StructType([
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
    StructField("metadata", MapType(StringType(), StringType()), True),
])
