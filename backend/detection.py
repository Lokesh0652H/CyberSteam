"""CyberStream CEP / Rule-based detection engine.

Deterministic Complex Event Processing over sliding time windows.
NO machine learning. Every alert carries explainable evidence
(rule, threshold, observed value, window, severity).
"""
from __future__ import annotations

import uuid
from collections import deque, defaultdict
from datetime import datetime, timezone, timedelta
from typing import Deque, Dict, List, Tuple

# ---- Default rule configuration (persisted/overridable in Mongo `rules`) -----
DEFAULT_RULES: List[dict] = [
    {
        "id": "BRUTE_FORCE",
        "name": "Brute Force",
        "description": "Many failed authentication attempts from one source IP against one destination within a window.",
        "enabled": True,
        "threshold": 5,
        "window_seconds": 60,
        "base_severity": "high",
    },
    {
        "id": "PORT_SCAN",
        "name": "Port Scan",
        "description": "One source IP attempting connections to many distinct destination ports within a short window.",
        "enabled": True,
        "threshold": 15,
        "window_seconds": 30,
        "base_severity": "high",
    },
    {
        "id": "DISTRIBUTED_BRUTE_FORCE",
        "name": "Distributed Brute Force",
        "description": "Multiple distinct source IPs targeting the same account/server within a window.",
        "enabled": True,
        "threshold": 8,
        "window_seconds": 90,
        "base_severity": "critical",
    },
    {
        "id": "DATA_EXFILTRATION",
        "name": "Suspicious Data Transfer",
        "description": "Unusually large outbound transfer volume from a single source within a window.",
        "enabled": True,
        "threshold": 5_000_000,  # bytes
        "window_seconds": 60,
        "base_severity": "critical",
    },
    {
        "id": "AUTHENTICATION_ANOMALY",
        "name": "Rapid Authentication Anomaly",
        "description": "failed -> failed -> success authentication sequence from a source within a short window.",
        "enabled": True,
        "threshold": 2,  # failures preceding success
        "window_seconds": 45,
        "base_severity": "medium",
    },
    {
        "id": "SSH_ATTACK",
        "name": "SSH Attack Pattern",
        "description": "Repeated SSH (port 22) connection attempts from a source.",
        "enabled": True,
        "threshold": 10,
        "window_seconds": 60,
        "base_severity": "high",
    },
    {
        "id": "DNS_ANOMALY",
        "name": "Suspicious DNS Activity",
        "description": "High-frequency DNS queries from a single source within a window.",
        "enabled": True,
        "threshold": 20,
        "window_seconds": 30,
        "base_severity": "medium",
    },
    {
        "id": "MULTI_STAGE_ATTACK",
        "name": "Multi-Stage Attack Correlation",
        "description": "Reconnaissance -> authentication attempts -> successful auth -> suspicious transfer from one source.",
        "enabled": True,
        "threshold": 4,  # stages observed
        "window_seconds": 180,
        "base_severity": "critical",
    },
]

SEVERITY_ORDER = {"low": 1, "medium": 2, "high": 3, "critical": 4}


def _sev_from_ratio(base: str, observed: float, threshold: float) -> str:
    """Escalate severity deterministically based on how far observed exceeds threshold."""
    ratio = observed / threshold if threshold else 1
    level = SEVERITY_ORDER[base]
    if ratio >= 3:
        level += 2
    elif ratio >= 1.8:
        level += 1
    level = max(1, min(4, level))
    for name, val in SEVERITY_ORDER.items():
        if val == level:
            return name
    return base


class CEPEngine:
    """Windowed, stateful CEP engine. Feed one normalized event at a time."""

    MAX_KEEP = 4000  # per-index cap to bound memory at high event rates

    def __init__(self):
        self.rules: Dict[str, dict] = {r["id"]: dict(r) for r in DEFAULT_RULES}
        # indexed event stores (timestamp, event)
        self._failed_auth: Dict[Tuple[str, str], Deque] = defaultdict(deque)  # (src,dst)->
        self._auth_seq: Dict[str, Deque] = defaultdict(deque)  # src -> auth events
        self._ports: Dict[str, Deque] = defaultdict(deque)  # src -> (ts,port)
        self._ssh: Dict[str, Deque] = defaultdict(deque)  # src -> ssh attempts
        self._dns: Dict[str, Deque] = defaultdict(deque)  # src -> dns
        self._bytes: Dict[str, Deque] = defaultdict(deque)  # src -> (ts,bytes)
        self._dist_bf: Dict[str, Deque] = defaultdict(deque)  # (dst|user) -> (ts,src)
        self._stages: Dict[str, Deque] = defaultdict(deque)  # src -> (ts,stage)
        self._last_fired: Dict[Tuple[str, str], datetime] = {}

    def set_rules(self, rules: List[dict]):
        for r in rules:
            if r["id"] in self.rules:
                self.rules[r["id"]].update(r)

    def reset(self):
        for d in (self._failed_auth, self._auth_seq, self._ports, self._dns,
                  self._ssh, self._bytes, self._dist_bf, self._stages):
            d.clear()
        self._last_fired.clear()

    def update_rule(self, rule_id: str, patch: dict):
        if rule_id in self.rules:
            self.rules[rule_id].update(patch)
            return self.rules[rule_id]
        return None

    def list_rules(self) -> List[dict]:
        return [dict(r) for r in self.rules.values()]

    @staticmethod
    def _prune(dq: Deque, now: datetime, window: int, cap: int):
        cutoff = now - timedelta(seconds=window)
        while dq and dq[0][0] < cutoff:
            dq.popleft()
        while len(dq) > cap:
            dq.popleft()

    def _cooldown_ok(self, rule_id: str, key: str, now: datetime, window: int) -> bool:
        k = (rule_id, key)
        last = self._last_fired.get(k)
        if last and (now - last).total_seconds() < window:
            return False
        self._last_fired[k] = now
        return True

    def _alert(self, rule: dict, source: str, target: str, observed, evidence: dict) -> dict:
        sev = _sev_from_ratio(rule["base_severity"], float(observed), float(rule["threshold"]))
        return {
            "alert_id": f"alrt_{uuid.uuid4().hex[:12]}",
            "rule": rule["id"],
            "rule_name": rule["name"],
            "severity": sev,
            "source": source,
            "target": target,
            "threshold": rule["threshold"],
            "observed": observed,
            "window": f"{rule['window_seconds']} seconds",
            "window_seconds": rule["window_seconds"],
            "evidence": evidence,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def process(self, ev: dict) -> List[dict]:
        """Return list of triggered alerts for this event."""
        alerts: List[dict] = []
        now = datetime.now(timezone.utc)
        src = ev.get("source_ip") or "unknown"
        dst = ev.get("destination_ip") or "unknown"
        etype = ev.get("event_type")
        action = ev.get("action")
        user = ev.get("username")

        # ---- RULE 1: BRUTE_FORCE ------------------------------------------
        r = self.rules["BRUTE_FORCE"]
        if r["enabled"] and etype in ("authentication", "ssh", "login") and action == "failed":
            key = (src, dst)
            dq = self._failed_auth[key]
            dq.append((now, ev))
            self._prune(dq, now, r["window_seconds"], self.MAX_KEEP)
            if len(dq) >= r["threshold"] and self._cooldown_ok("BRUTE_FORCE", f"{src}->{dst}", now, r["window_seconds"]):
                alerts.append(self._alert(r, src, dst, len(dq), {
                    "failed_attempts": len(dq),
                    "target_user": user,
                    "sample_ports": list({e[1].get("destination_port") for e in list(dq)[:5]}),
                }))

        # ---- RULE 2: PORT_SCAN --------------------------------------------
        r = self.rules["PORT_SCAN"]
        if r["enabled"] and etype in ("connection", "network"):
            dq = self._ports[src]
            dq.append((now, ev.get("destination_port")))
            self._prune(dq, now, r["window_seconds"], self.MAX_KEEP)
            distinct = {p for _, p in dq if p is not None}
            if len(distinct) >= r["threshold"] and self._cooldown_ok("PORT_SCAN", src, now, r["window_seconds"]):
                alerts.append(self._alert(r, src, dst, len(distinct), {
                    "distinct_ports": len(distinct),
                    "ports_sample": sorted(list(distinct))[:20],
                }))

        # ---- RULE 3: DISTRIBUTED_BRUTE_FORCE ------------------------------
        r = self.rules["DISTRIBUTED_BRUTE_FORCE"]
        if r["enabled"] and etype in ("authentication", "ssh", "login") and action == "failed":
            tkey = f"{dst}|{user or ''}"
            dq = self._dist_bf[tkey]
            dq.append((now, src))
            self._prune(dq, now, r["window_seconds"], self.MAX_KEEP)
            distinct_src = {s for _, s in dq}
            if len(distinct_src) >= r["threshold"] and self._cooldown_ok("DISTRIBUTED_BRUTE_FORCE", tkey, now, r["window_seconds"]):
                alerts.append(self._alert(r, f"{len(distinct_src)} sources", dst, len(distinct_src), {
                    "distinct_sources": len(distinct_src),
                    "sources_sample": list(distinct_src)[:10],
                    "target_user": user,
                }))

        # ---- RULE 4: DATA_EXFILTRATION ------------------------------------
        r = self.rules["DATA_EXFILTRATION"]
        if r["enabled"] and (ev.get("bytes") or 0) > 0 and etype in ("data_transfer", "http", "connection", "network"):
            dq = self._bytes[src]
            dq.append((now, ev.get("bytes") or 0))
            self._prune(dq, now, r["window_seconds"], self.MAX_KEEP)
            total = sum(b for _, b in dq)
            if total >= r["threshold"] and self._cooldown_ok("DATA_EXFILTRATION", src, now, r["window_seconds"]):
                alerts.append(self._alert(r, src, dst, total, {
                    "bytes_transferred": total,
                    "mb_transferred": round(total / 1_000_000, 2),
                    "transfer_count": len(dq),
                }))

        # ---- RULE 5: AUTHENTICATION_ANOMALY (failed,failed,success) -------
        r = self.rules["AUTHENTICATION_ANOMALY"]
        if r["enabled"] and etype in ("authentication", "ssh", "login"):
            dq = self._auth_seq[src]
            dq.append((now, action))
            self._prune(dq, now, r["window_seconds"], 200)
            actions = [a for _, a in dq]
            fails_before_success = 0
            if actions and actions[-1] == "success":
                i = len(actions) - 2
                while i >= 0 and actions[i] == "failed":
                    fails_before_success += 1
                    i -= 1
                if fails_before_success >= r["threshold"] and self._cooldown_ok("AUTHENTICATION_ANOMALY", src, now, r["window_seconds"]):
                    alerts.append(self._alert(r, src, dst, fails_before_success, {
                        "sequence": actions[-(fails_before_success + 1):],
                        "failed_before_success": fails_before_success,
                        "target_user": user,
                    }))

        # ---- RULE 6: SSH_ATTACK -------------------------------------------
        r = self.rules["SSH_ATTACK"]
        if r["enabled"] and (etype == "ssh" or ev.get("destination_port") == 22):
            dq = self._ssh[src]
            dq.append((now, ev))
            self._prune(dq, now, r["window_seconds"], self.MAX_KEEP)
            if len(dq) >= r["threshold"] and self._cooldown_ok("SSH_ATTACK", src, now, r["window_seconds"]):
                alerts.append(self._alert(r, src, dst, len(dq), {
                    "ssh_attempts": len(dq),
                    "target_user": user,
                }))

        # ---- RULE 7: DNS_ANOMALY ------------------------------------------
        r = self.rules["DNS_ANOMALY"]
        if r["enabled"] and etype == "dns":
            dq = self._dns[src]
            dq.append((now, ev.get("metadata", {}).get("domain")))
            self._prune(dq, now, r["window_seconds"], self.MAX_KEEP)
            if len(dq) >= r["threshold"] and self._cooldown_ok("DNS_ANOMALY", src, now, r["window_seconds"]):
                domains = [d for _, d in dq if d]
                alerts.append(self._alert(r, src, dst, len(dq), {
                    "query_count": len(dq),
                    "distinct_domains": len(set(domains)),
                    "domains_sample": list(dict.fromkeys(domains))[:8],
                }))

        # ---- RULE 8: MULTI_STAGE_ATTACK -----------------------------------
        r = self.rules["MULTI_STAGE_ATTACK"]
        if r["enabled"]:
            stage = None
            if etype in ("connection", "network"):
                stage = "recon"
            elif etype in ("authentication", "ssh", "login") and action == "failed":
                stage = "auth_attempt"
            elif etype in ("authentication", "ssh", "login") and action == "success":
                stage = "auth_success"
            elif (ev.get("bytes") or 0) > 500_000 or etype == "data_transfer":
                stage = "exfiltration"
            if stage:
                dq = self._stages[src]
                dq.append((now, stage))
                self._prune(dq, now, r["window_seconds"], 500)
                seq = [s for _, s in dq]
                order = ["recon", "auth_attempt", "auth_success", "exfiltration"]
                seen = [o for o in order if o in seq]
                # require ordered progression: recon before success before exfil
                if (len(seen) >= r["threshold"]
                        and "auth_success" in seq and "exfiltration" in seq
                        and seq.index("auth_success") <= (len(seq) - 1 - seq[::-1].index("exfiltration"))
                        and self._cooldown_ok("MULTI_STAGE_ATTACK", src, now, r["window_seconds"])):
                    alerts.append(self._alert(r, src, dst, len(seen), {
                        "stages_observed": seen,
                        "stage_count": len(seen),
                        "kill_chain": seq[-12:],
                    }))

        return alerts
