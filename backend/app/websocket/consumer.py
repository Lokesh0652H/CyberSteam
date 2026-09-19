import asyncio
import json
import os
from app.websocket.manager import manager

class KafkaWebSocketBridge:
    def __init__(self):
        self.running = False
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

    async def start(self):
        self.running = True
        asyncio.create_task(self.consume_events_loop())
        asyncio.create_task(self.consume_alerts_loop())

    def stop(self):
        self.running = False

    async def consume_events_loop(self):
        while self.running:
            try:
                def poll_kafka_events():
                    from kafka import KafkaConsumer
                    consumer = KafkaConsumer(
                        'cyber-events',
                        bootstrap_servers=self.bootstrap_servers,
                        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                        auto_offset_reset='latest',
                        consumer_timeout_ms=1000,
                        request_timeout_ms=2000
                    )
                    messages = []
                    for msg in consumer:
                        messages.append(msg.value)
                        if len(messages) >= 50:
                            break
                    consumer.close()
                    return messages

                messages = await asyncio.to_thread(poll_kafka_events)
                for event in messages:
                    await manager.broadcast_event(event)
            except Exception:
                await asyncio.sleep(5)

    async def consume_alerts_loop(self):
        while self.running:
            try:
                def poll_kafka_alerts():
                    from kafka import KafkaConsumer
                    consumer = KafkaConsumer(
                        'security-alerts',
                        bootstrap_servers=self.bootstrap_servers,
                        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                        auto_offset_reset='latest',
                        consumer_timeout_ms=1000,
                        request_timeout_ms=2000
                    )
                    messages = []
                    for msg in consumer:
                        messages.append(msg.value)
                        if len(messages) >= 50:
                            break
                    consumer.close()
                    return messages

                messages = await asyncio.to_thread(poll_kafka_alerts)
                for alert in messages:
                    await manager.broadcast_alert(alert)
            except Exception:
                await asyncio.sleep(5)

bridge = KafkaWebSocketBridge()
