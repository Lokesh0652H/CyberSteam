CREATE DATABASE IF NOT EXISTS cyberstream;
USE cyberstream;

CREATE EXTERNAL TABLE IF NOT EXISTS cyber_events_batch (
  event_id STRING,
  `timestamp` STRING,
  source_ip STRING,
  destination_ip STRING,
  source_port INT,
  destination_port INT,
  protocol STRING,
  event_type STRING,
  action STRING,
  bytes BIGINT,
  packets INT,
  username STRING,
  device_id STRING,
  country STRING,
  latitude DOUBLE,
  longitude DOUBLE,
  severity STRING,
  metadata STRING
)
PARTITIONED BY (event_date STRING)
STORED AS PARQUET
LOCATION 'hdfs://namenode:9000/user/cyberstream/events/batch';

CREATE EXTERNAL TABLE IF NOT EXISTS cyber_events_stream (
  event_id STRING,
  `timestamp` STRING,
  source_ip STRING,
  destination_ip STRING,
  source_port INT,
  destination_port INT,
  protocol STRING,
  event_type STRING,
  action STRING,
  bytes BIGINT,
  packets INT,
  username STRING,
  device_id STRING,
  country STRING,
  latitude DOUBLE,
  longitude DOUBLE,
  severity STRING,
  metadata STRING
)
PARTITIONED BY (event_date STRING)
STORED AS PARQUET
LOCATION 'hdfs://namenode:9000/user/cyberstream/events/stream';

MSCK REPAIR TABLE cyber_events_batch;
MSCK REPAIR TABLE cyber_events_stream;

CREATE VIEW IF NOT EXISTS cyber_events_all AS
SELECT event_id, `timestamp`, source_ip, destination_ip, source_port,
       destination_port, protocol, event_type, action, bytes, packets,
       username, device_id, country, latitude, longitude, severity, metadata,
       event_date
FROM cyber_events_batch
UNION ALL
SELECT event_id, `timestamp`, source_ip, destination_ip, source_port,
       destination_port, protocol, event_type, action, bytes, packets,
       username, device_id, country, latitude, longitude, severity, metadata,
       event_date
FROM cyber_events_stream;
