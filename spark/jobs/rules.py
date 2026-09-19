import uuid
from datetime import datetime, timezone
import logging
from jobs.sinks import get_postgres_connection, write_alerts_to_postgres_and_kafka

logger = logging.getLogger(__name__)

class RuleEngine:
    def __init__(self):
        self.rules = []
        self.last_load = None
        
    def load_rules_from_postgres(self):
        conn = get_postgres_connection()
        if not conn:
            logger.error("Could not connect to postgres to load rules")
            return
            
        try:
            cursor = conn.cursor()
            # Fetch active rules. Default schema:
            # rule_id, rule_name, description, event_types, threshold, time_window_sec, group_by_field, severity, active
            cursor.execute("""
                SELECT id, name, description, rule_type, condition_field, threshold, 
                       time_window_seconds, group_by_field, severity 
                FROM security_rules 
                WHERE is_active = true
            """)
            self.rules = []
            for row in cursor.fetchall():
                self.rules.append({
                    "rule_id": row[0],
                    "rule_name": row[1],
                    "description": row[2],
                    "event_types": row[3].split(",") if row[3] else [],  # rule_type contains comma-separated event types
                    "condition_field": row[4],
                    "threshold": row[5],
                    "time_window_sec": row[6],
                    "group_by_field": row[7],
                    "severity": row[8]
                })
            cursor.close()
            self.last_load = datetime.now(timezone.utc)
            logger.info(f"Loaded {len(self.rules)} rules from DB")
        except Exception as e:
            logger.error(f"Error loading rules: {e}")
        finally:
            conn.close()

    def evaluate_rules(self, batch_df, batch_id):
        # We periodically reload rules (e.g., every 30 seconds, simple implementation)
        if not self.rules or (self.last_load and (datetime.now(timezone.utc) - self.last_load).seconds > 30):
            self.load_rules_from_postgres()
            
        if not self.rules:
            return

        # For simplicity in microbatch, evaluate logic using pandas on collected batch (ok for small threshold evaluation per batch)
        # But this isn't strictly true to the sliding window across batches if we don't maintain state.
        # However, for realistic rule evaluation in a spark microbatch context WITHOUT heavy stateful spark logic:
        pdf = batch_df.toPandas()
        if pdf.empty:
            return
            
        alerts = []
        now = datetime.now(timezone.utc)
        
        for rule in self.rules:
            # Filter events
            event_types = rule['event_types']
            if isinstance(event_types, str):
                event_types = event_types.split(",")
                
            rule_events = pdf[pdf['event_type'].isin(event_types)]
            if rule_events.empty:
                continue
                
            # Group by
            group_field = rule['group_by_field']
            if group_field not in rule_events.columns:
                continue
                
            counts = rule_events.groupby(group_field).size()
            
            for group_val, count in counts.items():
                if count >= rule['threshold']:
                    # Generate alert
                    alert = {
                        "alert_id": f"alt_{uuid.uuid4().hex[:12]}",
                        "timestamp": now,
                        "rule_id": rule['rule_id'],
                        "rule_name": rule['rule_name'],
                        "severity": rule['severity'],
                        "description": f"{rule['rule_name']}: Threshold {rule['threshold']} exceeded. Count: {count}",
                        "status": "OPEN",
                        "event_count": int(count),
                        "first_seen": rule_events[rule_events[group_field] == group_val]['timestamp'].min().to_pydatetime(),
                        "last_seen": rule_events[rule_events[group_field] == group_val]['timestamp'].max().to_pydatetime(),
                        "source_ip": str(group_val) if group_field == "source_ip" else None,
                        "username": str(group_val) if group_field == "username" else None,
                        "server_id": str(group_val) if group_field == "server_id" else None
                    }
                    alerts.append(alert)
                    
        if alerts:
            write_alerts_to_postgres_and_kafka(alerts)

# Global engine instance for foreachBatch
rule_engine = RuleEngine()

def process_rules(batch_df, batch_id):
    rule_engine.evaluate_rules(batch_df, batch_id)
