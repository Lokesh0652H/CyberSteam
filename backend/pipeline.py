"""CyberStream real-time pipeline (in-process, mirrors Kafka->Spark->CEP->storage->WS).

Stages:
  EventProducer  -> asyncio.Queue  (== Kafka topic `cyber-events`)
  StreamProcessor: parse/validate -> normalize -> enrich -> `normalized-events`
                   -> CEP rule engine -> `security-alerts`
                   -> hot storage (Mongo) + cold storage (Parquet) + WebSocket broadcast
Metrics are measured, never hardcoded.
"""
from __future__ import annotations

import asyncio
import json
import random
import time
import uuid
import logging
from collections import deque, Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from detection import CEPEngine

logger = logging.getLogger("cyberstream.pipeline")

DATA_DIR = Path(__file__).parent.parent / "data"
COLD_DIR = DATA_DIR / "events"

# ---------------------------------------------------------------------------
# Synthetic-but-realistic event generation
# ---------------------------------------------------------------------------
COUNTRIES = [
    ("CN", 39.9, 116.4), ("RU", 55.7, 37.6), ("US", 37.7, -122.4), ("IN", 19.0, 72.8),
    ("BR", -23.5, -46.6), ("DE", 52.5, 13.4), ("NL", 52.3, 4.9), ("KP", 39.0, 125.7),
    ("IR", 35.7, 51.4), ("GB", 51.5, -0.12),
]
PROTOCOLS = ["TCP", "UDP", "ICMP"]
DEVICES = [f"server-{i:02d}" for i in range(1, 13)] + ["fw-edge-01", "db-primary", "auth-gw", "web-lb-01"]
COMMON_PORTS = [22, 80, 443, 3306, 5432, 53, 8080, 3389, 21, 25, 6379, 27017]
USERNAMES = ["root", "admin", "ubuntu", "svc_app", "postgres", "oracle", "jenkins", "deploy", None]
EVENT_TYPES = ["connection", "authentication", "ssh", "dns", "http", "network", "data_transfer", "login"]


def _rand_ip(internal=False) -> str:
    if internal:
        return f"10.0.{random.randint(0, 8)}.{random.randint(2, 254)}"
    return f"{random.randint(11, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


def make_event(**overrides) -> dict:
    country, lat, lon = random.choice(COUNTRIES)
    etype = overrides.get("event_type", random.choice(EVENT_TYPES))
    action = "attempt"
    if etype in ("authentication", "ssh", "login"):
        action = random.choices(["failed", "success"], weights=[0.75, 0.25])[0]
    ev = {
        "event_id": f"evt_{uuid.uuid4().hex[:16]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_ip": _rand_ip(),
        "destination_ip": _rand_ip(internal=True),
        "source_port": random.randint(1024, 65535),
        "destination_port": random.choice(COMMON_PORTS),
        "protocol": random.choice(PROTOCOLS),
        "event_type": etype,
        "action": action,
        "bytes": random.randint(64, 8000),
        "packets": random.randint(1, 40),
        "username": random.choice(USERNAMES),
        "device_id": random.choice(DEVICES),
        "country": country,
        "latitude": round(lat + random.uniform(-2, 2), 4),
        "longitude": round(lon + random.uniform(-2, 2), 4),
        "severity": "low",
        "simulation": False,
        "metadata": {},
    }
    if etype == "dns":
        ev["destination_port"] = 53
        ev["metadata"] = {"domain": random.choice(["cdn.example.com", "api.svc.local", "x9k2j.ddns.net", "mail.corp.io"]) }
    if etype == "data_transfer":
        ev["bytes"] = random.randint(10_000, 400_000)
    ev.update(overrides)
    return ev


# ---------------------------------------------------------------------------
# Metrics registry (all values measured live)
# ---------------------------------------------------------------------------
class Metrics:
    def __init__(self):
        self.events_received = 0
        self.events_processed = 0
        self.events_rejected = 0
        self.alerts_generated = 0
        self._rate_bucket = deque()  # timestamps of processed events (last 60s)
        self._latencies = deque(maxlen=500)  # detection latency ms
        self.ws_clients = 0
        self.last_batch_ts: Optional[str] = None

    def mark_processed(self, latency_ms: float):
        self.events_processed += 1
        now = time.time()
        self._rate_bucket.append(now)
        self._latencies.append(latency_ms)
        cutoff = now - 60
        while self._rate_bucket and self._rate_bucket[0] < cutoff:
            self._rate_bucket.popleft()
        self.last_batch_ts = datetime.now(timezone.utc).isoformat()

    def events_per_sec(self) -> float:
        now = time.time()
        recent = [t for t in self._rate_bucket if t > now - 5]
        return round(len(recent) / 5.0, 2)

    def avg_latency_ms(self) -> float:
        return round(sum(self._latencies) / len(self._latencies), 2) if self._latencies else 0.0

    def snapshot(self) -> dict:
        return {
            "events_received": self.events_received,
            "events_processed": self.events_processed,
            "events_rejected": self.events_rejected,
            "alerts_generated": self.alerts_generated,
            "events_per_sec": self.events_per_sec(),
            "detection_latency_ms": self.avg_latency_ms(),
            "kafka_throughput": self.events_per_sec(),
            "ws_clients": self.ws_clients,
            "last_batch_ts": self.last_batch_ts,
        }


# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------
class WSManager:
    def __init__(self, metrics: Metrics):
        self.active: set = set()
        self.metrics = metrics

    async def connect(self, ws):
        await ws.accept()
        self.active.add(ws)
        self.metrics.ws_clients = len(self.active)

    def disconnect(self, ws):
        self.active.discard(ws)
        self.metrics.ws_clients = len(self.active)

    async def broadcast(self, message: dict):
        if not self.active:
            return
        data = json.dumps(message, default=str)
        dead = []
        for ws in list(self.active):
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


# ---------------------------------------------------------------------------
# Cold storage (Parquet, partitioned year/month/day/hour)
# ---------------------------------------------------------------------------
class ColdStorage:
    def __init__(self, flush_size=200):
        self._buf = []
        self.flush_size = flush_size
        self.total_written = 0
        self.files_written = 0
        COLD_DIR.mkdir(parents=True, exist_ok=True)

    def add(self, ev: dict):
        self._buf.append(ev)
        if len(self._buf) >= self.flush_size:
            self.flush()

    def flush(self):
        if not self._buf:
            return
        try:
            import pandas as pd
            now = datetime.now(timezone.utc)
            part = COLD_DIR / f"year={now.year}" / f"month={now.month:02d}" / f"day={now.day:02d}" / f"hour={now.hour:02d}"
            part.mkdir(parents=True, exist_ok=True)
            df = pd.DataFrame(self._buf)
            fpath = part / f"events_{uuid.uuid4().hex[:10]}.parquet"
            df.to_parquet(fpath, engine="pyarrow", index=False)
            self.total_written += len(self._buf)
            self.files_written += 1
        except Exception as e:
            logger.error(f"Parquet flush failed: {e}")
        finally:
            self._buf.clear()

    def size_bytes(self) -> int:
        try:
            return sum(f.stat().st_size for f in COLD_DIR.rglob("*.parquet"))
        except Exception:
            return 0

    def query(self, limit=500, event_type=None, source_ip=None) -> list:
        try:
            import pandas as pd
            files = sorted(COLD_DIR.rglob("*.parquet"), reverse=True)
            frames = []
            for f in files[:40]:
                frames.append(pd.read_parquet(f))
                if sum(len(x) for x in frames) > limit * 4:
                    break
            if not frames:
                return []
            df = pd.concat(frames, ignore_index=True)
            if event_type:
                df = df[df["event_type"] == event_type]
            if source_ip:
                df = df[df["source_ip"] == source_ip]
            df = df.sort_values("timestamp", ascending=False).head(limit)
            return json.loads(df.to_json(orient="records"))
        except Exception as e:
            logger.error(f"Parquet query failed: {e}")
            return []


# ---------------------------------------------------------------------------
# Pipeline orchestrator
# ---------------------------------------------------------------------------
SEVERITY_BY_TYPE = {"connection": "low", "network": "low", "dns": "low", "http": "low",
                    "authentication": "medium", "login": "medium", "ssh": "medium", "data_transfer": "medium"}


class Pipeline:
    def __init__(self, db):
        self.db = db
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=20000)
        self.metrics = Metrics()
        self.engine = CEPEngine()
        self.ws = WSManager(self.metrics)
        self.cold = ColdStorage()
        self.running = False
        self.base_rate = 12  # events/sec baseline traffic
        self._producer_task = None
        self._consumer_task = None
        self._flush_task = None
        self._injections: list = []  # scheduled attack bursts
        self.protocol_counter = Counter()
        self.type_counter = Counter()
        self._event_batch = []
        self.started_at = None
        # simulation lab state
        self.sim_status = "idle"
        self.sim_scenario = None
        self.sim_phase = None
        self.sim_events_queued = 0
        self.sim_events_processed = 0
        self.sim_alerts = 0
        self.sim_started_at = None
        self._demo_task = None

    async def load_rules(self):
        docs = await self.db.rules.find({}, {"_id": 0}).to_list(100)
        if not docs:
            for r in self.engine.list_rules():
                await self.db.rules.insert_one({**r, "matches": 0})
        else:
            self.engine.set_rules(docs)

    async def start(self):
        if self.running:
            return
        self.running = True
        self.started_at = datetime.now(timezone.utc).isoformat()
        await self.load_rules()
        self._producer_task = asyncio.create_task(self._produce_loop())
        self._consumer_task = asyncio.create_task(self._consume_loop())
        self._flush_task = asyncio.create_task(self._periodic_flush())
        logger.info("Pipeline started")

    async def stop(self):
        self.running = False
        for t in (self._producer_task, self._consumer_task, self._flush_task):
            if t:
                t.cancel()
        self.cold.flush()
        logger.info("Pipeline stopped")

    def set_rate(self, rate: int):
        self.base_rate = max(0, int(rate))

    def inject_scenario(self, scenario: str) -> dict:
        """Enqueue a batch of crafted events that WILL travel the full pipeline."""
        events = build_scenario(scenario)
        self._injections.extend(events)
        return {"scenario": scenario, "events_queued": len(events)}

    def launch_attack(self, scenario: str, cfg: dict) -> dict:
        """Attack Simulation Lab: build configurable synthetic events (simulation=True)
        and inject them into the real pipeline. Detection is done by the CEP engine."""
        events = build_attack(scenario, cfg or {})
        for e in events:
            e["simulation"] = True
        self._injections.extend(events)
        self.sim_status = "running"
        self.sim_scenario = scenario
        self.sim_phase = scenario.replace("_", " ").upper()
        if not self.sim_started_at:
            self.sim_started_at = datetime.now(timezone.utc).isoformat()
        self.sim_events_queued += len(events)
        return {"scenario": scenario, "events_queued": len(events), "simulation": True}

    async def run_full_demo(self, step: int = 5) -> dict:
        steps = [
            ("port_scan", "RECONNAISSANCE"),
            ("brute_force", "BRUTE FORCE"),
            ("distributed_brute_force", "DISTRIBUTED BRUTE FORCE"),
            ("ssh_attack", "SSH ATTACK"),
            ("authentication_anomaly", "AUTHENTICATION ANOMALY"),
            ("dns_anomaly", "DNS ANOMALY"),
            ("data_exfiltration", "DATA EXFILTRATION"),
            ("multi_stage", "MULTI-STAGE ATTACK"),
        ]

        async def seq():
            try:
                self.sim_status = "running"
                self.sim_started_at = datetime.now(timezone.utc).isoformat()
                for scen, phase in steps:
                    self.sim_phase = phase
                    self.sim_scenario = scen
                    self.launch_attack(scen, {})
                    await asyncio.sleep(step)
                self.sim_phase = "DEMONSTRATION COMPLETE"
                self.sim_status = "idle"
            except asyncio.CancelledError:
                pass

        if self._demo_task and not self._demo_task.done():
            self._demo_task.cancel()
        self._demo_task = asyncio.create_task(seq())
        return {"status": "started", "steps": [s[0] for s in steps], "step_seconds": step}

    async def reset_simulation(self) -> dict:
        if self._demo_task and not self._demo_task.done():
            self._demo_task.cancel()
        self._demo_task = None
        self._injections.clear()
        self.engine.reset()
        self.sim_status = "idle"
        self.sim_scenario = None
        self.sim_phase = None
        self.sim_events_queued = 0
        self.sim_events_processed = 0
        self.sim_alerts = 0
        self.sim_started_at = None
        ev = (await self.db.events.delete_many({"simulation": True})).deleted_count
        al = (await self.db.alerts.delete_many({"simulation": True})).deleted_count
        inc = (await self.db.attack_incidents.delete_many({"simulation": True})).deleted_count
        return {"cleared_events": ev, "cleared_alerts": al, "cleared_incidents": inc}

    def sim_state(self) -> dict:
        elapsed = 0
        if self.sim_started_at:
            elapsed = int((datetime.now(timezone.utc) - datetime.fromisoformat(self.sim_started_at)).total_seconds())
        return {
            "status": self.sim_status, "scenario": self.sim_scenario, "phase": self.sim_phase,
            "events_generated": self.sim_events_queued, "events_processed": self.sim_events_processed,
            "alerts": self.sim_alerts, "elapsed": elapsed, "started_at": self.sim_started_at,
            "pending": len(self._injections), "metrics": self.metrics.snapshot(),
        }

    async def _produce_loop(self):
        while self.running:
            try:
                # baseline traffic
                n = self.base_rate
                for _ in range(n):
                    await self._offer(make_event())
                # drain injected attack events fast (bursty)
                inj = self._injections[:400]
                self._injections = self._injections[400:]
                for ev in inj:
                    await self._offer(ev)
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"producer error: {e}")
                await asyncio.sleep(1)

    async def _offer(self, ev: dict):
        self.metrics.events_received += 1
        try:
            self.queue.put_nowait(ev)
        except asyncio.QueueFull:
            self.metrics.events_rejected += 1

    async def _consume_loop(self):
        while self.running:
            try:
                ev = await asyncio.wait_for(self.queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            t0 = time.time()
            try:
                ev = self._normalize(ev)
            except Exception:
                self.metrics.events_rejected += 1
                continue
            alerts = self.engine.process(ev)
            latency = (time.time() - t0) * 1000
            self.metrics.mark_processed(latency)
            if ev.get("simulation"):
                self.sim_events_processed += 1
            self.protocol_counter[ev["protocol"]] += 1
            self.type_counter[ev["event_type"]] += 1
            self._event_batch.append(ev)
            self.cold.add(ev)
            await self.ws.broadcast({"type": "event", "data": ev})
            for a in alerts:
                await self._handle_alert(a, ev)

    def _normalize(self, ev: dict) -> dict:
        # validate required fields
        for f in ("source_ip", "destination_ip", "event_type"):
            if not ev.get(f):
                raise ValueError("missing field")
        ev.setdefault("protocol", "TCP")
        ev.setdefault("bytes", 0)
        ev.setdefault("metadata", {})
        base = SEVERITY_BY_TYPE.get(ev["event_type"], "low")
        if ev.get("action") == "failed":
            base = "medium"
        ev["severity"] = ev.get("severity") if ev.get("severity") not in (None, "low") else base
        ev["status"] = "processed"
        return ev

    async def _handle_alert(self, alert: dict, trigger_ev: dict):
        self.metrics.alerts_generated += 1
        alert["related_event_id"] = trigger_ev["event_id"]
        alert["simulation"] = bool(trigger_ev.get("simulation"))
        if alert["simulation"]:
            self.sim_alerts += 1
        await self.db.alerts.insert_one(dict(alert))
        await self.db.rules.update_one({"id": alert["rule"]}, {"$inc": {"matches": 1}})
        self.engine.rules[alert["rule"]]["matches"] = self.engine.rules[alert["rule"]].get("matches", 0) + 1
        # incident correlation: key by rule+source
        inc_key = f"{alert['rule']}::{alert['source']}"
        now = alert["timestamp"]
        inc = await self.db.attack_incidents.find_one({"incident_key": inc_key, "status": {"$ne": "mitigated"}})
        if inc:
            await self.db.attack_incidents.update_one(
                {"_id": inc["_id"]},
                {"$set": {"last_seen": now, "severity": alert["severity"], "observed": alert["observed"], "evidence": alert["evidence"]},
                 "$inc": {"alert_count": 1}},
            )
            incident_id = inc["incident_id"]
        else:
            incident_id = f"inc_{uuid.uuid4().hex[:12]}"
            doc = {
                "incident_id": incident_id, "incident_key": inc_key,
                "attack_type": alert["rule"], "attack_name": alert["rule_name"],
                "severity": alert["severity"], "source": alert["source"], "target": alert["target"],
                "first_seen": now, "last_seen": now, "status": "active",
                "alert_count": 1, "threshold": alert["threshold"], "observed": alert["observed"],
                "window": alert["window"], "evidence": alert["evidence"],
                "simulation": alert["simulation"],
            }
            await self.db.attack_incidents.insert_one(dict(doc))
        alert["incident_id"] = incident_id
        # track host
        await self.db.hosts.update_one(
            {"host": trigger_ev["device_id"]},
            {"$set": {"host": trigger_ev["device_id"], "last_event": now, "last_ip": trigger_ev["destination_ip"]},
             "$inc": {"event_count": 1, "alert_count": 1}}, upsert=True)
        await self.ws.broadcast({"type": "alert", "data": {k: v for k, v in alert.items() if k != "_id"}})
        await self.ws.broadcast({"type": "incident", "data": {"incident_id": incident_id, "attack_type": alert["rule"], "severity": alert["severity"]}})

    async def _periodic_flush(self):
        while self.running:
            try:
                await asyncio.sleep(3)
                # persist recent events batch to Mongo (hot storage), then trim
                if self._event_batch:
                    batch = self._event_batch
                    self._event_batch = []
                    await self.db.events.insert_many([dict(e) for e in batch])
                    # trim hot storage to last 20k
                    total = await self.db.events.count_documents({})
                    if total > 20000:
                        old = await self.db.events.find({}, {"_id": 1}).sort("timestamp", 1).limit(total - 20000).to_list(total - 20000)
                        await self.db.events.delete_many({"_id": {"$in": [o["_id"] for o in old]}})
                # persist metrics snapshot
                await self.db.system_metrics.insert_one({**self.metrics.snapshot(), "ts": datetime.now(timezone.utc).isoformat()})
                await self.ws.broadcast({"type": "metrics", "data": self.metrics.snapshot()})
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"flush error: {e}")


# ---------------------------------------------------------------------------
# Attack scenario builders (crafted so CEP rules deterministically fire)
# ---------------------------------------------------------------------------
def build_scenario(name: str) -> list:
    evs = []
    if name == "brute_force":
        src, dst = _rand_ip(), _rand_ip(internal=True)
        for _ in range(22):
            evs.append(make_event(event_type="ssh", action="failed", source_ip=src,
                                   destination_ip=dst, destination_port=22, username="root"))
    elif name == "port_scan":
        src, dst = _rand_ip(), _rand_ip(internal=True)
        for p in range(1, 36):
            evs.append(make_event(event_type="connection", source_ip=src, destination_ip=dst,
                                   destination_port=1000 + p, action="attempt"))
    elif name == "distributed_brute_force":
        dst = _rand_ip(internal=True)
        for _ in range(12):
            evs.append(make_event(event_type="authentication", action="failed", source_ip=_rand_ip(),
                                   destination_ip=dst, username="admin"))
    elif name == "data_exfiltration":
        src, dst = _rand_ip(internal=True), _rand_ip()
        for _ in range(15):
            evs.append(make_event(event_type="data_transfer", source_ip=src, destination_ip=dst,
                                   bytes=random.randint(400_000, 900_000)))
    elif name == "ssh_attack":
        src, dst = _rand_ip(), _rand_ip(internal=True)
        for _ in range(14):
            evs.append(make_event(event_type="ssh", action="failed", source_ip=src,
                                   destination_ip=dst, destination_port=22))
    elif name == "dns_anomaly":
        src = _rand_ip(internal=True)
        for i in range(26):
            evs.append(make_event(event_type="dns", source_ip=src, destination_port=53,
                                   metadata={"domain": f"{uuid.uuid4().hex[:8]}.exfil.net"}))
    elif name == "ddos_burst":
        dst = _rand_ip(internal=True)
        for _ in range(300):
            evs.append(make_event(event_type="connection", source_ip=_rand_ip(),
                                   destination_ip=dst, destination_port=80, protocol="TCP"))
    elif name == "multi_stage":
        src, dst = _rand_ip(), _rand_ip(internal=True)
        for p in range(1, 20):  # recon
            evs.append(make_event(event_type="connection", source_ip=src, destination_ip=dst, destination_port=1000 + p))
        for _ in range(6):  # auth attempts
            evs.append(make_event(event_type="ssh", action="failed", source_ip=src, destination_ip=dst, destination_port=22, username="root"))
        evs.append(make_event(event_type="ssh", action="success", source_ip=src, destination_ip=dst, destination_port=22, username="root"))
        for _ in range(6):  # exfiltration
            evs.append(make_event(event_type="data_transfer", source_ip=dst, destination_ip=src, bytes=random.randint(600_000, 900_000)))
    elif name == "normal":
        for _ in range(30):
            evs.append(make_event())
    return evs


def build_attack(scenario: str, cfg: dict) -> list:
    """Configurable attack builder for the Attack Simulation Lab. Uses reserved
    private/test addresses only. Returns synthetic events (tagged simulation later)."""
    g = lambda k, d: cfg.get(k, d)
    evs = []
    if scenario == "brute_force":
        src, dst = g("source_ip", "10.10.10.25"), g("target_ip", "10.10.20.10")
        user, proto = g("username", "admin"), str(g("protocol", "SSH")).upper()
        n = int(g("attempts", 20))
        et = "ssh" if proto == "SSH" else "authentication"
        port = 22 if et == "ssh" else 443
        for _ in range(n):
            evs.append(make_event(event_type=et, action="failed", source_ip=src, destination_ip=dst,
                                   destination_port=port, username=user, protocol="TCP"))
    elif scenario == "port_scan":
        src, dst = g("source_ip", "10.10.10.45"), g("target_ip", "10.10.20.15")
        start, count = int(g("start_port", 20)), int(g("ports", 20))
        for i in range(count):
            evs.append(make_event(event_type="connection", source_ip=src, destination_ip=dst,
                                   destination_port=start + i, action="attempt"))
    elif scenario == "distributed_brute_force":
        dst, user = g("target_ip", "10.10.20.10"), g("username", "admin")
        sources = int(g("sources", 10))
        for i in range(sources):
            s = f"10.10.10.{21 + i}"
            for _ in range(int(g("attempts_per_source", 2))):
                evs.append(make_event(event_type="authentication", action="failed", source_ip=s,
                                       destination_ip=dst, username=user, destination_port=443))
    elif scenario == "ssh_attack":
        src, dst = g("source_ip", "10.10.10.30"), g("target_ip", "10.10.20.10")
        n = int(g("attempts", 14))
        for _ in range(n):
            evs.append(make_event(event_type="ssh", action="failed", source_ip=src, destination_ip=dst,
                                   destination_port=22, username=g("username", "root")))
    elif scenario == "authentication_anomaly":
        src, dst = g("source_ip", "10.10.10.60"), g("target_ip", "10.10.20.10")
        fails = int(g("fails", 3))
        for _ in range(fails):
            evs.append(make_event(event_type="authentication", action="failed", source_ip=src,
                                   destination_ip=dst, username=g("username", "admin"), destination_port=443))
        evs.append(make_event(event_type="authentication", action="success", source_ip=src,
                              destination_ip=dst, username=g("username", "admin"), destination_port=443))
    elif scenario == "data_exfiltration":
        src, dst = g("source_ip", "10.10.20.15"), g("target_ip", "10.10.30.50")
        mb = float(g("mb", 850))
        chunks = 12
        per = int(mb * 1_000_000 / chunks)
        for _ in range(chunks):
            evs.append(make_event(event_type="data_transfer", source_ip=src, destination_ip=dst,
                                   bytes=per, protocol="TCP"))
    elif scenario == "dns_anomaly":
        src = g("source_ip", "10.10.20.22")
        n = int(g("queries", 26))
        for i in range(n):
            evs.append(make_event(event_type="dns", source_ip=src, destination_ip="10.10.30.53",
                                   destination_port=53, metadata={"domain": f"suspicious-domain-{i:03d}.test"}))
    elif scenario == "multi_stage":
        src, dst = g("source_ip", "10.10.10.99"), g("target_ip", "10.10.20.10")
        for i in range(20):  # recon
            evs.append(make_event(event_type="connection", source_ip=src, destination_ip=dst, destination_port=1000 + i))
        for _ in range(6):  # auth attempts
            evs.append(make_event(event_type="ssh", action="failed", source_ip=src, destination_ip=dst, destination_port=22, username="root"))
        evs.append(make_event(event_type="ssh", action="success", source_ip=src, destination_ip=dst, destination_port=22, username="root"))
        for _ in range(6):  # exfiltration (same attacker source so the kill-chain correlates)
            evs.append(make_event(event_type="data_transfer", source_ip=src, destination_ip="10.10.30.50", bytes=random.randint(600_000, 900_000)))
    else:
        evs = build_scenario(scenario)
    return evs
