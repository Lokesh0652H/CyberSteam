from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, SessionLocal
from app.db.models import User
from app.db.seed import seed_db

from app.api import auth, dashboard, events, alerts, analytics, ips, servers, rules, system, generator, audit, reports
from app.websocket import routes as ws_routes
import contextlib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cyberstream")

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    logger.info("Starting CyberStream API...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")
    
    db = SessionLocal()
    try:
        if not db.query(User).first():
            logger.info("Seeding database with initial data...")
            seed_db()
            logger.info("Database seeded.")
        else:
            logger.info("Database already seeded.")
    except Exception as e:
        logger.error(f"Error during seed: {e}")
    finally:
        db.close()
    
    # Try to start Kafka consumer bridge (non-fatal if Kafka is unavailable)
    try:
        from app.websocket.consumer import bridge
        await bridge.start()
        logger.info("Kafka WebSocket bridge started.")
    except Exception as e:
        logger.warning(f"Kafka bridge failed to start (Kafka may be unavailable): {e}")
    
    yield
    
    # Shutdown
    try:
        from app.websocket.consumer import bridge
        bridge.stop()
    except Exception:
        pass
    logger.info("CyberStream API shutdown complete.")

app = FastAPI(
    title="CyberStream API",
    description="Distributed Cybersecurity Event Analytics & Real-Time Security Monitoring Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(ips.router)
app.include_router(servers.router)
app.include_router(rules.router)
app.include_router(system.router)
app.include_router(generator.router)
app.include_router(audit.router)
app.include_router(reports.router)
app.include_router(ws_routes.router)

@app.get("/")
def root():
    return {
        "service": "CyberStream API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }
