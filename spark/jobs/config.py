import os
from jobs.config import (KAFKA_SERVERS, CHECKPOINT_EVENTS, CHECKPOINT_HDFS, 
                         HDFS_URL)

KAFKA_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
POSTGRES_URL = os.getenv("POSTGRES_URL", "jdbc:postgresql://postgres:5432/cyberstream")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

HDFS_URL = os.getenv("HDFS_URL", "hdfs://namenode:9000/cyberstream/events")

CHECKPOINT_EVENTS = "/tmp/checkpoints/events"
CHECKPOINT_HDFS = "/tmp/checkpoints/hdfs"
CHECKPOINT_ALERTS = "/tmp/checkpoints/alerts"
