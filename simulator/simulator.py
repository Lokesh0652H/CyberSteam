"""CyberStream attack simulator — injects crafted attack scenarios into Kafka.

Each scenario emits real events through the `cyber-events` topic so they travel
the full pipeline (Kafka -> Spark -> CEP -> storage -> WebSocket -> dashboard).
"""
import argparse
import json
import os
import random
import time
import uuid
from datetime import datetime, timezone

from kafka import KafkaProducer

BROKER = os.environ.get("KAFKA_BROKER", "localhost:9092")
TOPIC = os.environ.get("KAFKA_TOPIC_EVENTS", "cyber-events")


def rand_ip(internal=False):
    if internal:
        return f"10.0.{random.randint(0,8)}.{random.randint(2,254)}"
    return ".".join(str(random.randint(1, 254)) for _ in range(4))


def base(**kw):
    ev = {"event_id": f"evt_{uuid.uuid4().hex[:16]}", "timestamp": datetime.now(timezone.utc).isoformat(),
          "source_ip": rand_ip(), "destination_ip": rand_ip(internal=True), "source_port": random.randint(1024, 65535),
          "destination_port": 443, "protocol": "TCP", "event_type": "connection", "action": "attempt",
          "bytes": 512, "packets": 4, "username": None, "device_id": "server-01", "country": "CN",
          "latitude": 0.0, "longitude": 0.0, "severity": "low", "metadata": {}}
    ev.update(kw)
    return ev


def scenario(name):
    evs = []
    if name == "brute_force":
        s, d = rand_ip(), rand_ip(internal=True)
        evs = [base(event_type="ssh", action="failed", source_ip=s, destination_ip=d, destination_port=22, username="root") for _ in range(22)]
    elif name == "port_scan":
        s, d = rand_ip(), rand_ip(internal=True)
        evs = [base(event_type="connection", source_ip=s, destination_ip=d, destination_port=1000 + p) for p in range(35)]
    elif name == "data_exfiltration":
        s, d = rand_ip(internal=True), rand_ip()
        evs = [base(event_type="data_transfer", source_ip=s, destination_ip=d, bytes=random.randint(400_000, 900_000)) for _ in range(15)]
    elif name == "multi_stage":
        s, d = rand_ip(), rand_ip(internal=True)
        evs += [base(event_type="connection", source_ip=s, destination_ip=d, destination_port=1000 + p) for p in range(20)]
        evs += [base(event_type="ssh", action="failed", source_ip=s, destination_ip=d, destination_port=22, username="root") for _ in range(6)]
        evs += [base(event_type="ssh", action="success", source_ip=s, destination_ip=d, destination_port=22, username="root")]
        evs += [base(event_type="data_transfer", source_ip=d, destination_ip=s, bytes=random.randint(600_000, 900_000)) for _ in range(6)]
    return evs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("scenario", choices=["brute_force", "port_scan", "data_exfiltration", "multi_stage"])
    args = ap.parse_args()
    producer = KafkaProducer(bootstrap_servers=BROKER, value_serializer=lambda v: json.dumps(v).encode())
    evs = scenario(args.scenario)
    for e in evs:
        producer.send(TOPIC, e)
    producer.flush()
    print(f"[simulator] injected {len(evs)} events for scenario '{args.scenario}'")


if __name__ == "__main__":
    main()
