"""Windowed CEP detection rules as Spark Structured Streaming aggregations.

Deterministic, threshold-based. NO machine learning. Each returns a DataFrame
conforming to the `alerts` schema: rule, severity, source, target, threshold,
observed, window, evidence(json), timestamp.
"""
from pyspark.sql.functions import (col, window, count, sum as _sum, approx_count_distinct,
                                    lit, to_json, struct, current_timestamp)

BRUTE_FORCE_THRESHOLD = 5
PORT_SCAN_THRESHOLD = 15
EXFIL_THRESHOLD_BYTES = 5_000_000


def _alert(df, rule, severity, source_col, target_col, observed_col, threshold, window_expr):
    return df.select(
        lit(rule).alias("rule"),
        lit(severity).alias("severity"),
        col(source_col).alias("source"),
        col(target_col).alias("target"),
        lit(threshold).alias("threshold"),
        col(observed_col).alias("observed"),
        lit(window_expr).alias("window"),
        to_json(struct(col(observed_col).alias("observed"))).alias("evidence"),
        current_timestamp().alias("timestamp"),
    )


def brute_force(events):
    agg = (events.filter((col("event_type").isin("authentication", "ssh")) & (col("action") == "failed"))
           .groupBy(window("ts", "60 seconds"), "source_ip", "destination_ip")
           .agg(count("*").alias("fails"))
           .filter(col("fails") >= BRUTE_FORCE_THRESHOLD))
    return _alert(agg, "BRUTE_FORCE", "high", "source_ip", "destination_ip", "fails",
                  BRUTE_FORCE_THRESHOLD, "60 seconds")


def port_scan(events):
    agg = (events.filter(col("event_type").isin("connection", "network"))
           .groupBy(window("ts", "30 seconds"), "source_ip", "destination_ip")
           .agg(approx_count_distinct("destination_port").alias("ports"))
           .filter(col("ports") >= PORT_SCAN_THRESHOLD))
    return _alert(agg, "PORT_SCAN", "high", "source_ip", "destination_ip", "ports",
                  PORT_SCAN_THRESHOLD, "30 seconds")


def data_exfiltration(events):
    agg = (events.filter(col("event_type").isin("data_transfer", "http", "connection"))
           .groupBy(window("ts", "60 seconds"), "source_ip", "destination_ip")
           .agg(_sum("bytes").alias("total_bytes"))
           .filter(col("total_bytes") >= EXFIL_THRESHOLD_BYTES))
    return _alert(agg, "DATA_EXFILTRATION", "critical", "source_ip", "destination_ip", "total_bytes",
                  EXFIL_THRESHOLD_BYTES, "60 seconds")
