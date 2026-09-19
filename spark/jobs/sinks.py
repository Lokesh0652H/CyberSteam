import psycopg2
import psycopg2.extras
import json
import logging
from kafka import KafkaProducer
from jobs.config import POSTGRES_URL, POSTGRES_USER, POSTGRES_PASSWORD, KAFKA_SERVERS

logger = logging.getLogger(__name__)

def get_postgres_connection():
    # Parse JDBC URL manually for psycopg2
    # jdbc:postgresql://postgres:5432/cyberstream
    try:
        parts = POSTGRES_URL.replace("jdbc:postgresql://", "").split("/")
        host_port = parts[0].split(":")
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else "5432"
        db = parts[1]
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=db,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD
        )
        return conn
    except Exception as e:
        logger.error(f"Postgres connection failed: {e}")
        return None

def write_events_to_postgres(batch_df, batch_id):
    # Collect batch to driver for batch insert
    # In a real heavy prod, might use mapPartitions, but for this scale, collect() or rdd.mapPartitions works.
    # To keep it true to micro-batching without overloading driver, use foreachPartition
    def process_partition(partition):
        conn = get_postgres_connection()
        if not conn:
            return
            
        cursor = conn.cursor()
        
        events_query = """
        INSERT INTO events (
            event_id, timestamp, event_type, source_ip, destination_ip, 
            source_port, destination_port, username, service, endpoint, 
            http_method, status_code, response_time_ms, country, city, 
            severity, server_id, metadata
        ) VALUES %s
        ON CONFLICT (event_id) DO NOTHING;
        """
        
        events_data = []
        for row in partition:
            events_data.append((
                row.event_id, row.timestamp, row.event_type, row.source_ip, row.destination_ip,
                row.source_port, row.destination_port, row.username, row.service, row.endpoint,
                row.http_method, row.status_code, row.response_time_ms, row.country, row.city,
                row.severity, row.server_id, json.dumps(row.metadata) if row.metadata else None
            ))
            
            # Batch size of 1000
            if len(events_data) >= 1000:
                psycopg2.extras.execute_values(cursor, events_query, events_data)
                conn.commit()
                events_data = []
                
        if events_data:
            psycopg2.extras.execute_values(cursor, events_query, events_data)
            conn.commit()
            
        cursor.close()
        conn.close()

    batch_df.rdd.foreachPartition(process_partition)

def write_statistics_to_postgres(batch_df, batch_id, window_size):
    def process_partition(partition):
        conn = get_postgres_connection()
        if not conn:
            return
        cursor = conn.cursor()
        
        stat_query = """
        INSERT INTO event_statistics (
            window_start, window_end, window_size, event_type, event_count, 
            unique_ips, unique_users, avg_response_time, failed_count, 
            blocked_count, error_count
        ) VALUES %s
        """
        
        stat_data = []
        for row in partition:
            stat_data.append((
                row.window.start, row.window.end, window_size, row.event_type, row.event_count,
                row.unique_ips, row.unique_users, row.avg_response_time, row.failed_count,
                row.blocked_count, row.error_count
            ))
            if len(stat_data) >= 1000:
                psycopg2.extras.execute_values(cursor, stat_query, stat_data)
                conn.commit()
                stat_data = []
                
        if stat_data:
            psycopg2.extras.execute_values(cursor, stat_query, stat_data)
            conn.commit()
            
        cursor.close()
        conn.close()
        
    batch_df.rdd.foreachPartition(process_partition)

def write_alerts_to_postgres_and_kafka(alerts):
    if not alerts:
        return
        
    # To Postgres
    conn = get_postgres_connection()
    if conn:
        cursor = conn.cursor()
        alert_query = """
        INSERT INTO security_alerts (
            alert_id, timestamp, rule_id, rule_name, severity, source_ip, 
            username, server_id, description, status, first_seen, last_seen, event_count
        ) VALUES %s
        ON CONFLICT (alert_id) DO NOTHING;
        """
        
        alert_data = [
            (a['alert_id'], a['timestamp'], a['rule_id'], a['rule_name'], a['severity'], 
             a.get('source_ip'), a.get('username'), a.get('server_id'), a['description'], 
             a['status'], a['first_seen'], a['last_seen'], a['event_count']) 
            for a in alerts
        ]
        
        psycopg2.extras.execute_values(cursor, alert_query, alert_data)
        conn.commit()
        cursor.close()
        conn.close()
        
    # To Kafka
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        for a in alerts:
            # handle datetime serialization
            a_copy = dict(a)
            a_copy['timestamp'] = a_copy['timestamp'].isoformat()
            a_copy['first_seen'] = a_copy['first_seen'].isoformat()
            a_copy['last_seen'] = a_copy['last_seen'].isoformat()
            producer.send('security-alerts', a_copy)
        producer.flush()
    except Exception as e:
        logger.error(f"Failed to publish alerts to Kafka: {e}")
