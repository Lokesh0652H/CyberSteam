"""Replay generated CSV events through Kafka for Spark Structured Streaming."""

import argparse
import csv
import json
import os
import time

from kafka import KafkaProducer


BROKER = os.environ.get("KAFKA_BROKER", "localhost:9092")
TOPIC = os.environ.get("KAFKA_TOPIC_EVENTS", "cyber-events")
INTEGER_FIELDS = {"source_port", "destination_port", "bytes", "packets"}
FLOAT_FIELDS = {"latitude", "longitude"}


def convert(row: dict) -> dict:
    event = dict(row)
    for field in INTEGER_FIELDS:
        event[field] = int(event[field])
    for field in FLOAT_FIELDS:
        event[field] = float(event[field])
    event["metadata"] = json.loads(event["metadata"])
    return event


def replay(input_path: str, rate: float = 0, batch_size: int = 1000) -> int:
    if rate < 0:
        raise ValueError("rate cannot be negative")
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")

    producer = KafkaProducer(
        bootstrap_servers=BROKER,
        value_serializer=lambda value: json.dumps(value).encode("utf-8"),
        key_serializer=lambda key: key.encode("utf-8"),
        acks="all",
        retries=5,
        linger_ms=20,
    )
    count = 0
    last_send = time.monotonic()
    interval = 1 / rate if rate else 0
    try:
        with open(input_path, newline="", encoding="utf-8") as stream:
            for row in csv.DictReader(stream):
                event = convert(row)
                producer.send(TOPIC, key=event["source_ip"], value=event)
                count += 1
                if count % batch_size == 0:
                    producer.flush()
                if interval:
                    remaining = interval - (time.monotonic() - last_send)
                    if remaining > 0:
                        time.sleep(remaining)
                    last_send = time.monotonic()
        producer.flush()
    finally:
        producer.close()
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default="/data/bda/input/cyber_events.csv")
    parser.add_argument(
        "--rate",
        type=float,
        default=0,
        help="events per second; 0 replays as fast as Kafka accepts events",
    )
    parser.add_argument("--batch-size", type=int, default=1000)
    args = parser.parse_args()
    count = replay(args.input, args.rate, args.batch_size)
    print(f"Replayed {count:,} events to {BROKER}/{TOPIC}.")


if __name__ == "__main__":
    main()
