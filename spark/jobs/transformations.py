import json
from pyspark.sql.functions import col, from_json, to_timestamp, year, month, dayofmonth, hour, when
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, MapType

event_schema = StructType([
    StructField("event_id", StringType(), True),
    StructField("timestamp", StringType(), True),
    StructField("event_type", StringType(), True),
    StructField("source_ip", StringType(), True),
    StructField("destination_ip", StringType(), True),
    StructField("source_port", IntegerType(), True),
    StructField("destination_port", IntegerType(), True),
    StructField("username", StringType(), True),
    StructField("service", StringType(), True),
    StructField("endpoint", StringType(), True),
    StructField("http_method", StringType(), True),
    StructField("status_code", IntegerType(), True),
    StructField("response_time_ms", IntegerType(), True),
    StructField("country", StringType(), True),
    StructField("city", StringType(), True),
    StructField("severity", StringType(), True),
    StructField("server_id", StringType(), True),
    StructField("metadata", MapType(StringType(), StringType()), True)
])

def parse_event(df):
    return df.select(
        from_json(col("value").cast("string"), event_schema).alias("event")
    ).select("event.*")

def validate_events(df):
    # Simply filters out null event_ids
    valid_df = df.filter(col("event_id").isNotNull())
    invalid_df = df.filter(col("event_id").isNull())
    return valid_df, invalid_df

def clean_events(df):
    # Convert timestamp string to timestamp type
    return df.withColumn("timestamp", to_timestamp(col("timestamp")))

def enrich_events(df):
    return df.withColumn("year", year(col("timestamp"))) \
             .withColumn("month", month(col("timestamp"))) \
             .withColumn("day", dayofmonth(col("timestamp"))) \
             .withColumn("hour", hour(col("timestamp")))

def categorize_events(df):
    return df.withColumn(
        "category",
        when(col("event_type").isin("LOGIN_SUCCESS", "LOGIN_FAILURE", "LOGOUT", "SESSION_START", "SESSION_END", "PASSWORD_CHANGE"), "authentication")
        .when(col("event_type").isin("HTTP_REQUEST", "API_REQUEST", "SERVER_ERROR", "ACCESS_DENIED"), "http")
        .when(col("event_type").isin("FIREWALL_ALLOW", "FIREWALL_BLOCK"), "firewall")
        .when(col("event_type").isin("DNS_REQUEST", "DNS_BLOCK"), "dns")
        .when(col("event_type") == "DATABASE_ACCESS", "database")
        .otherwise("other")
    )
