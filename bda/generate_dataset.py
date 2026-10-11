"""Generate a reproducible, large synthetic cybersecurity events CSV dataset."""

import argparse
import csv
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path


FIELDS = [
    "event_id",
    "timestamp",
    "source_ip",
    "destination_ip",
    "source_port",
    "destination_port",
    "protocol",
    "event_type",
    "action",
    "bytes",
    "packets",
    "username",
    "device_id",
    "country",
    "latitude",
    "longitude",
    "severity",
    "metadata",
]
EVENT_TYPES = [
    "authentication",
    "ssh",
    "dns",
    "connection",
    "network",
    "data_transfer",
    "http",
]
PORTS = [22, 53, 80, 443, 3389, 5432, 8080, 8443]
COUNTRIES = ["US", "IN", "BR", "DE", "GB", "CN", "RU"]
USERS = ["admin", "analyst", "service", "root", "guest"]
SEVERITY_BY_TYPE = {
    "authentication": "medium",
    "ssh": "high",
    "dns": "low",
    "connection": "low",
    "network": "medium",
    "data_transfer": "high",
    "http": "low",
}


def make_event(index: int, rng: random.Random, start: datetime, days: int) -> dict:
    event_type = rng.choices(EVENT_TYPES, weights=[28, 15, 12, 18, 10, 7, 10])[0]
    action = (
        rng.choices(["failed", "success"], weights=[8, 2])[0]
        if event_type in ("authentication", "ssh")
        else "attempt"
    )
    source_number = rng.randint(1, 4094)
    source_ip = f"198.51.{source_number // 254}.{source_number % 254 + 1}"
    destination_ip = f"10.{rng.randint(0, 15)}.{rng.randint(0, 255)}.{rng.randint(1, 254)}"
    event_time = start + timedelta(seconds=rng.randrange(days * 86400))
    country = rng.choice(COUNTRIES)
    severity = SEVERITY_BY_TYPE[event_type]
    if event_type in ("authentication", "ssh") and action == "failed":
        severity = "high"
    details = {
        "generator": "cyberstream-synthetic-v1",
        "scenario": (
            "brute_force"
            if event_type in ("authentication", "ssh") and action == "failed"
            else "normal"
        ),
    }

    return {
        "event_id": f"synthetic-{index:012d}",
        "timestamp": event_time.isoformat(timespec="milliseconds"),
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "source_port": rng.randint(1024, 65535),
        "destination_port": rng.choice(PORTS),
        "protocol": rng.choice(["TCP", "UDP", "ICMP"]),
        "event_type": event_type,
        "action": action,
        "bytes": rng.randint(64, 2_000_000 if event_type == "data_transfer" else 8000),
        "packets": rng.randint(1, 400),
        "username": rng.choice(USERS) if event_type in ("authentication", "ssh") else "",
        "device_id": f"server-{rng.randint(1, 200):03d}",
        "country": country,
        "latitude": round(rng.uniform(-55, 70), 5),
        "longitude": round(rng.uniform(-170, 170), 5),
        "severity": severity,
        "metadata": json.dumps(details, separators=(",", ":"), sort_keys=True),
    }


def generate_dataset(rows: int, output: Path, seed: int = 42, days: int = 30) -> int:
    if rows < 1:
        raise ValueError("rows must be at least 1")
    if days < 1:
        raise ValueError("days must be at least 1")

    output.parent.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    with output.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS)
        writer.writeheader()
        for index in range(rows):
            writer.writerow(make_event(index, rng, start, days))
    return output.stat().st_size


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=1_000_000)
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/bda/input/cyber_events.csv"),
    )
    args = parser.parse_args()
    size = generate_dataset(args.rows, args.output, args.seed, args.days)
    print(f"Wrote {args.rows:,} synthetic events to {args.output} ({size:,} bytes).")


if __name__ == "__main__":
    main()
