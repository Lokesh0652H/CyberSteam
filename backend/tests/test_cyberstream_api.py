"""CyberStream backend API acceptance tests.

Covers: auth (admin/analyst/viewer), RBAC on simulator+export, statistics,
rules (8 enabled), simulator attack scenarios (brute_force / port_scan /
multi_stage) and Reset filtering, incidents, system health.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend .env
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

ADMIN = {"email": "rijab72468@art2mart.com", "password": "CyberStream@2026"}
ANALYST = {"email": "analyst@cyberstream.io", "password": "analyst123"}
VIEWER = {"email": "viewer@cyberstream.io", "password": "viewer123"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="session")
def admin_token():
    return _login(ADMIN)


@pytest.fixture(scope="session")
def analyst_token():
    return _login(ANALYST)


@pytest.fixture(scope="session")
def viewer_token():
    return _login(VIEWER)


def _h(t):
    return {"Authorization": f"Bearer {t}"}


# --------------- Auth ---------------
class TestAuth:
    def test_admin_login(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_analyst_login(self, analyst_token):
        r = requests.get(f"{API}/auth/me", headers=_h(analyst_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "analyst"

    def test_viewer_login(self, viewer_token):
        r = requests.get(f"{API}/auth/me", headers=_h(viewer_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "viewer"

    def test_bad_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": "no@x.io", "password": "wrong"}, timeout=10)
        assert r.status_code == 401


# --------------- Core read ---------------
class TestCore:
    def test_statistics(self, admin_token):
        r = requests.get(f"{API}/statistics", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_events", "active_alerts", "events_per_sec", "severity_distribution"):
            assert k in d

    def test_rules_8_enabled(self, admin_token):
        r = requests.get(f"{API}/rules", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) == 8, f"expected 8 rules got {len(items)}"
        assert all(x["enabled"] for x in items), "all rules should be enabled"

    def test_system_health(self, admin_token):
        r = requests.get(f"{API}/system/health", headers=_h(admin_token), timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["services"]["database"] == "online"
        assert d["services"]["api"] == "online"


# --------------- RBAC ---------------
class TestRBAC:
    def test_viewer_cannot_launch_attack(self, viewer_token):
        r = requests.post(f"{API}/simulator/attack",
                          headers=_h(viewer_token),
                          json={"scenario": "brute_force"}, timeout=10)
        assert r.status_code == 403

    def test_viewer_cannot_export(self, viewer_token):
        r = requests.get(f"{API}/project/export/size", headers=_h(viewer_token), timeout=10)
        assert r.status_code == 403

    def test_viewer_cannot_reset(self, viewer_token):
        r = requests.post(f"{API}/simulator/reset", headers=_h(viewer_token), timeout=10)
        assert r.status_code == 403

    def test_analyst_can_launch(self, analyst_token):
        r = requests.post(f"{API}/simulator/attack",
                          headers=_h(analyst_token),
                          json={"scenario": "brute_force"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("simulation") is True


# --------------- Simulator Acceptance ---------------
def _wait_for_sim_alert(admin_token, rule_id, timeout=25):
    """Poll /api/alerts until a simulation:true alert with the given rule appears."""
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        r = requests.get(f"{API}/alerts?rule={rule_id}&page_size=100", headers=_h(admin_token), timeout=10)
        if r.status_code == 200:
            items = r.json()["items"]
            sim = [a for a in items if a.get("simulation") is True and a.get("rule") == rule_id]
            if sim:
                return sim
            last = items
        time.sleep(1.5)
    return last or []


class TestSimulator:
    def test_reset_then_brute_force(self, admin_token):
        rr = requests.post(f"{API}/simulator/reset", headers=_h(admin_token), timeout=15)
        assert rr.status_code == 200
        la = requests.post(f"{API}/simulator/attack", headers=_h(admin_token),
                           json={"scenario": "brute_force"}, timeout=15)
        assert la.status_code == 200
        body = la.json()
        assert body["events_queued"] > 0
        assert body["simulation"] is True
        # BRUTE_FORCE or SSH_ATTACK both acceptable per spec
        got = _wait_for_sim_alert(admin_token, "BRUTE_FORCE", timeout=25)
        if not got:
            got = _wait_for_sim_alert(admin_token, "SSH_ATTACK", timeout=10)
        assert got, "no simulation brute_force/ssh alert produced"

    def test_port_scan(self, admin_token):
        requests.post(f"{API}/simulator/reset", headers=_h(admin_token), timeout=15)
        la = requests.post(f"{API}/simulator/attack", headers=_h(admin_token),
                           json={"scenario": "port_scan", "config": {"ports": 25}}, timeout=15)
        assert la.status_code == 200
        got = _wait_for_sim_alert(admin_token, "PORT_SCAN", timeout=25)
        assert got, "no simulation PORT_SCAN alert produced"

    def test_multi_stage_incident(self, admin_token):
        requests.post(f"{API}/simulator/reset", headers=_h(admin_token), timeout=15)
        la = requests.post(f"{API}/simulator/attack", headers=_h(admin_token),
                           json={"scenario": "multi_stage"}, timeout=15)
        assert la.status_code == 200
        # wait for incident
        deadline = time.time() + 30
        found = None
        while time.time() < deadline:
            r = requests.get(f"{API}/incidents", headers=_h(admin_token), timeout=10)
            if r.status_code == 200:
                incs = r.json()["items"]
                found = [i for i in incs if i.get("attack_type") == "MULTI_STAGE_ATTACK" and i.get("simulation")]
                if found:
                    break
            time.sleep(1.5)
        assert found, "no MULTI_STAGE_ATTACK simulation incident produced"
        # incident detail contains recommended_steps
        iid = found[0]["incident_id"]
        det = requests.get(f"{API}/incidents/{iid}", headers=_h(admin_token), timeout=10)
        assert det.status_code == 200
        d = det.json()
        assert "recommended_steps" in d and len(d["recommended_steps"]) > 0
        assert "evidence" in d and "threshold" in d and "observed" in d

    def test_reset_clears_sim(self, admin_token):
        # ensure something exists
        requests.post(f"{API}/simulator/attack", headers=_h(admin_token),
                      json={"scenario": "brute_force"}, timeout=15)
        time.sleep(3)
        rr = requests.post(f"{API}/simulator/reset", headers=_h(admin_token), timeout=15)
        assert rr.status_code == 200
        body = rr.json()
        assert "cleared_alerts" in body and "cleared_incidents" in body
        # after reset, no sim alerts should remain
        time.sleep(1)
        r = requests.get(f"{API}/alerts?page_size=200", headers=_h(admin_token), timeout=10)
        remaining_sim = [a for a in r.json()["items"] if a.get("simulation")]
        assert not remaining_sim, f"sim alerts remain after reset: {len(remaining_sim)}"


# --------------- Export ---------------
class TestExport:
    def test_admin_can_get_export_size(self, admin_token):
        r = requests.get(f"{API}/project/export/size", headers=_h(admin_token), timeout=15)
        assert r.status_code == 200
