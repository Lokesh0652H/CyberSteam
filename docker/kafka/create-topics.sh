#!/bin/bash
echo 'Waiting for Kafka to be ready...'
cub kafka-ready -b kafka:9092 1 60

kafka-topics --create --if-not-exists --bootstrap-server kafka:9092 --topic cyber-events --partitions 3 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server kafka:9092 --topic security-alerts --partitions 3 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server kafka:9092 --topic authentication-events --partitions 3 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server kafka:9092 --topic http-events --partitions 3 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server kafka:9092 --topic firewall-events --partitions 3 --replication-factor 1
echo 'Topics created successfully'
