from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from auth import (Auth, get_current_user, require_roles, hash_password, verify_password,
                  create_access_token, seed_users, ROLES)
from pipeline import Pipeline
import export_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cyberstream")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="CyberStream API", version="1.0.0",
              description="Real-time Big Data cybersecurity monitoring & CEP threat detection")
api = APIRouter(prefix="/api")

pipeline = Pipeline(db)


# ------------------------- Schemas -------------------------
class LoginReq(BaseModel):
    email: EmailStr
    password: str


class RegisterReq(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: str = "viewer"


class RulePatch(BaseModel):
    enabled: bool | None = None
    threshold: float | None = None
    window_seconds: int | None = None


class SimReq(BaseModel):
    rate: int | None = None
    scenario: str | None = None


class AttackReq(BaseModel):
    scenario: str
    config: dict | None = None


class DemoReq(BaseModel):
    step_seconds: int | None = 5


# ------------------------- Auth -------------------------
@api.post("/auth/login")
async def login(body: LoginReq, request: Request, response: Response):
    email = body.email.lower()
    ip = request.client.host if request.client else "?"
    identifier = f"{ip}:{email}"
    await Auth.check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await Auth.record_failed(identifier, email)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await Auth.clear_attempts(identifier)
    uid = str(user["_id"])
    token = create_access_token(uid, email, user["role"])
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    return {"token": token, "user": {"id": uid, "email": email, "name": user.get("name"), "role": user["role"]}}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user.get("name"), "role": user["role"]}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.post("/auth/register")
async def register(body: RegisterReq, admin: dict = Depends(require_roles("admin"))):
    if body.role not in ROLES:
        raise HTTPException(status_code=422, detail="Invalid role")
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=409, detail="Email already registered")
    doc = {"email": body.email.lower(), "password_hash": hash_password(body.password),
           "name": body.name, "role": body.role, "created_at": datetime.now(timezone.utc).isoformat()}
    res = await db.users.insert_one(doc)
    return {"id": str(res.inserted_id), "email": doc["email"], "name": doc["name"], "role": doc["role"]}


@api.get("/auth/users")
async def list_users(admin: dict = Depends(require_roles("admin"))):
    users = await db.users.find({}, {"password_hash": 0}).to_list(200)
    return [{"id": str(u["_id"]), "email": u["email"], "name": u.get("name"), "role": u["role"]} for u in users]


# ------------------------- Events -------------------------
@api.get("/events")
async def get_events(user: dict = Depends(get_current_user), q: str | None = None,
                     severity: str | None = None, event_type: str | None = None,
                     source_ip: str | None = None, sort: str = "timestamp", order: int = -1,
                     page: int = 1, page_size: int = 50):
    flt = {}
    if severity:
        flt["severity"] = severity
    if event_type:
        flt["event_type"] = event_type
    if source_ip:
        flt["source_ip"] = source_ip
    if q:
        flt["$or"] = [{"source_ip": {"$regex": q, "$options": "i"}},
                      {"destination_ip": {"$regex": q, "$options": "i"}},
                      {"event_id": {"$regex": q, "$options": "i"}},
                      {"device_id": {"$regex": q, "$options": "i"}}]
    total = await db.events.count_documents(flt)
    cur = db.events.find(flt, {"_id": 0}).sort(sort, order).skip((page - 1) * page_size).limit(page_size)
    items = await cur.to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


@api.get("/events/{event_id}")
async def get_event(event_id: str, user: dict = Depends(get_current_user)):
    ev = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev


@api.get("/events/history/cold")
async def cold_events(user: dict = Depends(get_current_user), limit: int = 300,
                      event_type: str | None = None, source_ip: str | None = None):
    return {"source": "parquet_cold_storage", "items": pipeline.cold.query(limit, event_type, source_ip)}


# ------------------------- Alerts -------------------------
@api.get("/alerts")
async def get_alerts(user: dict = Depends(get_current_user), severity: str | None = None,
                     rule: str | None = None, page: int = 1, page_size: int = 50):
    flt = {}
    if severity:
        flt["severity"] = severity
    if rule:
        flt["rule"] = rule
    total = await db.alerts.count_documents(flt)
    items = await db.alerts.find(flt, {"_id": 0}).sort("timestamp", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


@api.get("/alerts/{alert_id}")
async def get_alert(alert_id: str, user: dict = Depends(get_current_user)):
    a = await db.alerts.find_one({"alert_id": alert_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    return a


# ------------------------- Incidents -------------------------
@api.get("/incidents")
async def get_incidents(user: dict = Depends(get_current_user), status: str | None = None):
    flt = {}
    if status:
        flt["status"] = status
    items = await db.attack_incidents.find(flt, {"_id": 0}).sort("last_seen", -1).limit(200).to_list(200)
    return {"total": len(items), "items": items}


@api.get("/incidents/{incident_id}")
async def get_incident(incident_id: str, user: dict = Depends(get_current_user)):
    inc = await db.attack_incidents.find_one({"incident_id": incident_id}, {"_id": 0})
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    related = await db.alerts.find({"incident_id": incident_id}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    inc["related_alerts"] = related
    inc["recommended_steps"] = RECOMMENDATIONS.get(inc["attack_type"], DEFAULT_STEPS)
    return inc


@api.put("/incidents/{incident_id}/status")
async def set_incident_status(incident_id: str, status: str = Query(...),
                              user: dict = Depends(require_roles("admin", "analyst"))):
    if status not in ("active", "investigating", "mitigated", "dismissed"):
        raise HTTPException(status_code=422, detail="Invalid status")
    res = await db.attack_incidents.update_one({"incident_id": incident_id}, {"$set": {"status": status}})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"ok": True, "status": status}


# ------------------------- Statistics / Analytics -------------------------
@api.get("/statistics")
async def statistics(user: dict = Depends(get_current_user)):
    total_events = await db.events.count_documents({})
    active_alerts = await db.alerts.count_documents({})
    critical = await db.alerts.count_documents({"severity": "critical"})
    incidents = await db.attack_incidents.count_documents({})
    active_incidents = await db.attack_incidents.count_documents({"status": {"$in": ["active", "investigating"]}})
    hosts = await db.hosts.count_documents({})
    m = pipeline.metrics.snapshot()
    sev_pipeline = [{"$group": {"_id": "$severity", "count": {"$sum": 1}}}]
    sev = {d["_id"]: d["count"] async for d in db.events.aggregate(sev_pipeline)}
    return {
        "total_events": pipeline.metrics.events_processed,
        "events_per_sec": m["events_per_sec"], "active_alerts": active_alerts,
        "critical_alerts": critical, "affected_hosts": hosts,
        "attack_incidents": incidents, "active_incidents": active_incidents,
        "kafka_throughput": m["kafka_throughput"], "detection_latency_ms": m["detection_latency_ms"],
        "events_processed": m["events_processed"], "alerts_generated": m["alerts_generated"],
        "severity_distribution": sev,
    }


@api.get("/statistics/timeline")
async def timeline(user: dict = Depends(get_current_user), points: int = 30):
    docs = await db.system_metrics.find({}, {"_id": 0}).sort("ts", -1).limit(points).to_list(points)
    return {"items": list(reversed(docs))}


@api.get("/analytics/summary")
async def analytics_summary(user: dict = Depends(get_current_user)):
    top_src = [d async for d in db.alerts.aggregate([
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 10}])]
    top_targets = [d async for d in db.hosts.aggregate([
        {"$sort": {"alert_count": -1}}, {"$limit": 10}])]
    attack_types = [d async for d in db.alerts.aggregate([
        {"$group": {"_id": "$rule", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}])]
    return {
        "top_source_ips": [{"ip": d["_id"], "count": d["count"]} for d in top_src],
        "top_targeted_hosts": [{"host": d.get("host"), "alerts": d.get("alert_count", 0), "events": d.get("event_count", 0)} for d in top_targets],
        "attack_types": [{"type": d["_id"], "count": d["count"]} for d in attack_types],
        "protocol_distribution": dict(pipeline.protocol_counter),
        "event_type_distribution": dict(pipeline.type_counter),
    }


@api.get("/network/graph")
async def network_graph(user: dict = Depends(get_current_user)):
    alerts = await db.alerts.find({}, {"_id": 0}).sort("timestamp", -1).limit(120).to_list(120)
    nodes, links, seen = {}, [], set()
    for a in alerts:
        s, t = str(a.get("source")), str(a.get("target"))
        nodes.setdefault(s, {"id": s, "type": "attacker", "severity": a["severity"]})
        nodes.setdefault(t, {"id": t, "type": "target", "severity": a["severity"]})
        key = (s, t, a["rule"])
        if key not in seen:
            seen.add(key)
            links.append({"source": s, "target": t, "rule": a["rule"], "severity": a["severity"]})
    return {"nodes": list(nodes.values()), "links": links}


@api.get("/hosts")
async def get_hosts(user: dict = Depends(get_current_user)):
    items = await db.hosts.find({}, {"_id": 0}).sort("alert_count", -1).limit(200).to_list(200)
    return {"total": len(items), "items": items}


# ------------------------- Rules -------------------------
@api.get("/rules")
async def get_rules(user: dict = Depends(get_current_user)):
    docs = await db.rules.find({}, {"_id": 0}).to_list(100)
    return {"items": docs}


@api.put("/rules/{rule_id}")
async def update_rule(rule_id: str, patch: RulePatch, admin: dict = Depends(require_roles("admin"))):
    upd = {k: v for k, v in patch.model_dump().items() if v is not None}
    if not upd:
        raise HTTPException(status_code=422, detail="No fields to update")
    res = await db.rules.update_one({"id": rule_id}, {"$set": upd})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Rule not found")
    pipeline.engine.update_rule(rule_id, upd)
    doc = await db.rules.find_one({"id": rule_id}, {"_id": 0})
    return doc


# ------------------------- System health -------------------------
@api.get("/system/health")
async def system_health(user: dict = Depends(get_current_user)):
    services = {}
    # PostgreSQL role is played by MongoDB (hot storage) in the live environment
    try:
        await db.command("ping")
        services["database"] = "online"
    except Exception:
        services["database"] = "offline"
    m = pipeline.metrics.snapshot()
    services["pipeline"] = "online" if pipeline.running else "offline"
    services["kafka"] = "online" if pipeline.running and m["events_per_sec"] > 0 else ("degraded" if pipeline.running else "offline")
    services["spark"] = "online" if pipeline.running and m["events_processed"] > 0 else ("degraded" if pipeline.running else "offline")
    services["websocket"] = "online" if pipeline.metrics.ws_clients > 0 else "degraded"
    services["api"] = "online"
    return {"services": services, "metrics": m, "started_at": pipeline.started_at,
            "cold_storage_bytes": pipeline.cold.size_bytes(),
            "cold_files": pipeline.cold.files_written, "queue_depth": pipeline.queue.qsize()}


@api.get("/system/metrics")
async def system_metrics(user: dict = Depends(get_current_user)):
    return pipeline.metrics.snapshot()


# ------------------------- Simulator -------------------------
@api.get("/simulator/status")
async def sim_status(user: dict = Depends(get_current_user)):
    return {"running": pipeline.running, "base_rate": pipeline.base_rate,
            "queue_depth": pipeline.queue.qsize(), "pending_injections": len(pipeline._injections)}


@api.post("/simulator/start")
async def sim_start(body: SimReq, user: dict = Depends(require_roles("admin", "analyst"))):
    if body.rate is not None:
        pipeline.set_rate(body.rate)
    if not pipeline.running:
        await pipeline.start()
    result = {"running": True, "base_rate": pipeline.base_rate}
    if body.scenario:
        result["injection"] = pipeline.inject_scenario(body.scenario)
    return result


@api.post("/simulator/stop")
async def sim_stop(user: dict = Depends(require_roles("admin", "analyst"))):
    await pipeline.stop()
    return {"running": False}


@api.post("/simulator/scenario")
async def sim_scenario(body: SimReq, user: dict = Depends(require_roles("admin", "analyst"))):
    if not body.scenario:
        raise HTTPException(status_code=422, detail="scenario required")
    if not pipeline.running:
        await pipeline.start()
    return pipeline.inject_scenario(body.scenario)


@api.post("/simulator/rate")
async def sim_rate(body: SimReq, user: dict = Depends(require_roles("admin", "analyst"))):
    if body.rate is None:
        raise HTTPException(status_code=422, detail="rate required")
    pipeline.set_rate(body.rate)
    return {"base_rate": pipeline.base_rate}


@api.post("/simulator/attack")
async def sim_attack(body: AttackReq, user: dict = Depends(require_roles("admin", "analyst"))):
    if not pipeline.running:
        await pipeline.start()
    return pipeline.launch_attack(body.scenario, body.config or {})


@api.post("/simulator/demo/full")
async def sim_demo_full(body: DemoReq, user: dict = Depends(require_roles("admin", "analyst"))):
    if not pipeline.running:
        await pipeline.start()
    return await pipeline.run_full_demo(body.step_seconds or 5)


@api.post("/simulator/reset")
async def sim_reset(user: dict = Depends(require_roles("admin", "analyst"))):
    return await pipeline.reset_simulation()


@api.get("/simulator/state")
async def sim_lab_state(user: dict = Depends(get_current_user)):
    st = pipeline.sim_state()
    st["incidents"] = await db.attack_incidents.count_documents({"simulation": True})
    return st


# ------------------------- Project export -------------------------
@api.get("/project/export/size")
async def export_size(mode: str = "complete", user: dict = Depends(require_roles("admin", "analyst"))):
    return export_service.estimate_size(mode)


@api.get("/project/export")
async def export_project(mode: str = "complete", user: dict = Depends(require_roles("admin", "analyst"))):
    try:
        zip_path = export_service.build_archive(mode)
    except Exception as e:
        logger.error(f"export failed: {e}")
        raise HTTPException(status_code=500, detail="Unable to create project archive")

    def _iter():
        with open(zip_path, "rb") as f:
            while chunk := f.read(65536):
                yield chunk
        try:
            os.remove(zip_path)
        except OSError:
            pass

    fname = "cyberstream-project.zip" if mode == "complete" else f"cyberstream-{mode}.zip"
    return StreamingResponse(_iter(), media_type="application/zip",
                             headers={"Content-Disposition": f'attachment; filename="{fname}"'})


# ------------------------- WebSocket -------------------------
@api.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await pipeline.ws.connect(ws)
    try:
        await ws.send_json({"type": "metrics", "data": pipeline.metrics.snapshot()})
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pipeline.ws.disconnect(ws)
    except Exception:
        pipeline.ws.disconnect(ws)


RECOMMENDATIONS = {
    "BRUTE_FORCE": ["Block the offending source IP at the edge firewall", "Enforce account lockout & rate limiting", "Rotate credentials for the targeted account", "Enable MFA on the target service"],
    "PORT_SCAN": ["Block source IP and add to watchlist", "Verify exposed services and close unused ports", "Review IDS/IPS signatures"],
    "DISTRIBUTED_BRUTE_FORCE": ["Enable distributed rate limiting / WAF", "Force password reset on targeted account", "Deploy CAPTCHA and MFA", "Correlate source IPs against threat intel"],
    "DATA_EXFILTRATION": ["Isolate the source host immediately", "Inspect DLP logs for sensitive data", "Block egress to destination", "Begin incident response & forensics"],
    "AUTHENTICATION_ANOMALY": ["Review the successful login for legitimacy", "Terminate active sessions for the account", "Force credential rotation"],
    "SSH_ATTACK": ["Disable password SSH auth, enforce keys", "Restrict SSH to bastion/VPN", "Fail2ban / block source IP"],
    "DNS_ANOMALY": ["Inspect for DNS tunneling / exfiltration", "Block suspicious domains at resolver", "Quarantine the querying host"],
    "MULTI_STAGE_ATTACK": ["Activate full incident response playbook", "Isolate compromised host & preserve evidence", "Reset all related credentials", "Hunt for lateral movement across the estate"],
}
DEFAULT_STEPS = ["Investigate the source and target", "Correlate related events", "Apply mitigation and monitor"]


app.include_router(api)
_cors = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")]
_allow_all = _cors == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=not _allow_all,
    allow_origins=_cors,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    Auth.bind(db)
    await db.users.create_index("email", unique=True)
    await db.events.create_index("timestamp")
    await db.events.create_index("severity")
    await db.events.create_index("event_id")
    await db.alerts.create_index("timestamp")
    await db.alerts.create_index("rule")
    await db.attack_incidents.create_index("incident_id")
    await db.login_attempts.create_index("identifier")
    await seed_users(db)
    await pipeline.start()
    _write_test_credentials()
    logger.info("CyberStream backend started")


@app.on_event("shutdown")
async def shutdown():
    await pipeline.stop()
    client.close()


def _write_test_credentials():
    try:
        content = f"""# CyberStream Test Credentials

## Admin (full access: rules, simulator, export, everything)
- email: {os.environ['ADMIN_EMAIL']}
- password: {os.environ['ADMIN_PASSWORD']}
- role: admin

## Analyst (investigate incidents, run simulator, export)
- email: analyst@cyberstream.io
- password: analyst123
- role: analyst

## Viewer (read-only dashboard, no simulator/export)
- email: viewer@cyberstream.io
- password: viewer123
- role: viewer

## Auth endpoints
- POST /api/auth/login
- GET  /api/auth/me
- POST /api/auth/logout
- POST /api/auth/register (admin only)
"""
        Path("/app/memory/test_credentials.md").write_text(content)
    except Exception as e:
        logger.warning(f"could not write test_credentials.md: {e}")
