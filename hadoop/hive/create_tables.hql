CREATE EXTERNAL TABLE IF NOT EXISTS cyber_events (
  event_id STRING,
  event_type STRING,
  source_ip STRING,
  destination_ip STRING,
  source_port INT,
  destination_port INT,
  username STRING,
  service STRING,
  endpoint STRING,
  http_method STRING,
  status_code INT,
  response_time_ms INT,
  country STRING,
  city STRING,
  severity STRING,
  server_id STRING
)
PARTITIONED BY (year INT, month INT, day INT, hour INT)
STORED AS PARQUET
LOCATION 'hdfs://namenode:9000/cyberstream/events';

MSCK REPAIR TABLE cyber_events;

CREATE EXTERNAL TABLE IF NOT EXISTS security_alerts (
  alert_id STRING,
  timestamp TIMESTAMP,
  rule_id STRING,
  rule_name STRING,
  severity STRING,
  source_ip STRING,
  username STRING,
  server_id STRING,
  description STRING,
  status STRING,
  first_seen TIMESTAMP,
  last_seen TIMESTAMP,
  event_count INT
)
STORED AS PARQUET
LOCATION 'hdfs://namenode:9000/cyberstream/alerts';
