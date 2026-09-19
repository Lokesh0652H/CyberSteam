import json
import os
import logging
import httpx
from typing import List
from app.schemas import CyberEvent

logger = logging.getLogger(__name__)

BACKEND_INGEST_URL = os.getenv("BACKEND_INGEST_URL", "http://localhost:8000/api/events/ingest")

class KafkaEventProducer:
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        self.total_published = 0
        self.total_failed = 0
        self.producer = None
        self.http_client = httpx.Client(timeout=1.0)
        self.connect()

    def connect(self):
        try:
            from kafka import KafkaProducer
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                acks='all',
                retries=1,
                request_timeout_ms=500
            )
            logger.info("Connected to Kafka")
        except Exception:
            self.producer = None

    def publish_event(self, event: CyberEvent):
        if not self.producer:
            return False
            
        event_dict = event.model_dump()
        event_dict['timestamp'] = event_dict['timestamp'].isoformat()
        
        try:
            self.producer.send('cyber-events', event_dict)
            if event.event_type in ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'SESSION_START', 'SESSION_END', 'PASSWORD_CHANGE']:
                self.producer.send('authentication-events', event_dict)
            elif event.event_type in ['HTTP_REQUEST', 'API_REQUEST', 'SERVER_ERROR', 'ACCESS_DENIED']:
                self.producer.send('http-events', event_dict)
            elif event.event_type in ['FIREWALL_ALLOW', 'FIREWALL_BLOCK']:
                self.producer.send('firewall-events', event_dict)
                
            self.total_published += 1
            return True
        except Exception:
            self.total_failed += 1
            return False

    def publish_events(self, events: List[CyberEvent]):
        serialized_list = []
        for event in events:
            ed = event.model_dump()
            ed['timestamp'] = ed['timestamp'].isoformat()
            serialized_list.append(ed)
            self.publish_event(event)
            
        if self.producer:
            try:
                self.producer.flush()
            except Exception:
                pass

        # Ingest into backend for real-time dashboard, rules evaluation, & WebSockets
        try:
            resp = self.http_client.post(BACKEND_INGEST_URL, json=serialized_list)
            if resp.status_code == 200:
                self.total_published += len(serialized_list)
        except Exception as e:
            logger.debug(f"Direct backend ingest: {e}")
