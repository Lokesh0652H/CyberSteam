from pyspark.sql import SparkSession
from pyspark.sql.functions import window, count, countDistinct, avg, sum, when, col

from jobs.config import KAFKA_SERVERS, CHECKPOINT_EVENTS, CHECKPOINT_HDFS, HDFS_URL
from jobs.transformations import parse_event, validate_events, clean_events, enrich_events, categorize_events
from jobs.sinks import write_events_to_postgres, write_statistics_to_postgres
from jobs.rules import process_rules

def main():
    spark = SparkSession.builder \
        .appName('CyberStream-Processor') \
        .getOrCreate()
        
    spark.sparkContext.setLogLevel("WARN")
    
    # 1. Read from Kafka
    raw_stream = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_SERVERS) \
        .option("subscribe", "cyber-events") \
        .option("startingOffsets", "latest") \
        .load()
        
    # 2. Parse and validate
    parsed_df = parse_event(raw_stream)
    valid_df, invalid_df = validate_events(parsed_df)
    
    # 3. Clean and enrich
    cleaned_df = clean_events(valid_df)
    enriched_df = enrich_events(cleaned_df)
    categorized_df = categorize_events(enriched_df)
    
    # 4. Watermark for late data
    watermarked = categorized_df.withWatermark("timestamp", "30 seconds")
    
    # 5. Write raw events to HDFS (Parquet partitioned)
    hdfs_query = enriched_df.writeStream \
        .format("parquet") \
        .option("path", HDFS_URL) \
        .option("checkpointLocation", CHECKPOINT_HDFS) \
        .partitionBy("year", "month", "day", "hour") \
        .start()
        
    # 6. Write events to Postgres
    pg_query = watermarked.writeStream \
        .foreachBatch(write_events_to_postgres) \
        .outputMode("append") \
        .option("checkpointLocation", CHECKPOINT_EVENTS) \
        .start()
        
    # 7. Rule evaluation (foreachBatch)
    rules_query = watermarked.writeStream \
        .foreachBatch(process_rules) \
        .outputMode("append") \
        .option("checkpointLocation", "/tmp/checkpoints/rules") \
        .start()
        
    # 8. Window Aggregations
    window_sizes = ["1 minute", "5 minutes", "15 minutes", "1 hour"]
    window_queries = []
    
    for w_size in window_sizes:
        windowed = watermarked.groupBy(
            window("timestamp", w_size),
            "event_type"
        ).agg(
            count("*").alias("event_count"),
            countDistinct("source_ip").alias("unique_ips"),
            countDistinct("username").alias("unique_users"),
            avg("response_time_ms").alias("avg_response_time"),
            sum(when(col("event_type") == "LOGIN_FAILURE", 1).otherwise(0)).alias("failed_count"),
            sum(when(col("event_type") == "FIREWALL_BLOCK", 1).otherwise(0)).alias("blocked_count"),
            sum(when(col("status_code") >= 500, 1).otherwise(0)).alias("error_count")
        )
        
        # Write to Postgres
        # Using closure to capture w_size
        def write_stats_closure(size):
            def write_stats(batch_df, batch_id):
                write_statistics_to_postgres(batch_df, batch_id, size)
            return write_stats
            
        wq = windowed.writeStream \
            .foreachBatch(write_stats_closure(w_size)) \
            .outputMode("update") \
            .option("checkpointLocation", f"/tmp/checkpoints/stats_{w_size.replace(' ', '_')}") \
            .start()
            
        window_queries.append(wq)

    spark.streams.awaitAnyTermination()

if __name__ == "__main__":
    main()
