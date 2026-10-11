"""Kafka producer — emits normalized cybersecurity events at a configurable rate.

Serialization: JSON. Partitions keyed by source_ip so per-source windows land
on the same partition. Retries + idempotence enabled.
"""
import json
import os
import random
import time
import uuid
from datetime import datetime, timezone

from kafka import KafkaProducer

BROKER = os.environ.get("KAFKA_BROKER", "localhost:9092")
TOPIC = os.environ.get("KAFKA_TOPIC_EVENTS", "cyber-events")
RATE = int(os.environ.get("EVENT_RATE", "50"))

COMMON_PORTS = [22, 80, 443, 3306, 5432, 53, 8080, 3389, 21, 25]
EVENT_TYPES = ["connection", "authentication", "ssh", "dns", "http", "network", "data_transfer"]


def rand_ip(internal=False):
    if internal:
        return f"10.0.{random.randint(0,8)}.{random.randint(2,254)}"
    return ".".join(str(random.randint(1, 254)) for _ in range(4))


def make_event():
    etype = random.choice(EVENT_TYPES)
    action = random.choice(["failed", "success"]) if etype in ("authentication", "ssh") else "attempt"
    return {
        "event_id": f"evt_{uuid.uuid4().hex[:16]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_ip": rand_ip(),
        "destination_ip": rand_ip(internal=True),
        "source_port": random.randint(1024, 65535),
        "destination_port": random.choice(COMMON_PORTS),
        "protocol": random.choice(["TCP", "UDP", "ICMP"]),
        "event_type": etype,
        "action": action,
        "bytes": random.randint(64, 8000),
        "packets": random.randint(1, 40),
        "username": random.choice(["root", "admin", "ubuntu", None]),
        "device_id": f"server-{random.randint(1,12):02d}",
        "country": random.choice(["CN", "RU", "US", "IN", "BR"]),
        "latitude": 0.0, "longitude": 0.0,
        "severity": "low", "metadata": {},
    }


def build_producer():
    return KafkaProducer(
        bootstrap_servers=BROKER,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        key_serializer=lambda k: k.encode("utf-8"),
        acks="all", retries=5, enable_idempotence=True, linger_ms=20,
    )


def main():
    producer = build_producer()
    print(f"[producer] -> {BROKER}/{TOPIC} at {RATE} events/sec")
    interval = 1.0 / max(1, RATE)
    while True:
        ev = make_event()
        producer.send(TOPIC, key=ev["source_ip"], value=ev)
        time.sleep(interval)


if __name__ == "__main__":
    main()
