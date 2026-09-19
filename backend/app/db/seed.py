from sqlalchemy.orm import Session
from app.auth.security import hash_password
from app.db.models import User, RoleEnum, Server, ServerStatusEnum, EnvironmentEnum, SecurityRule
from app.db.database import SessionLocal, engine, Base

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed Users
        if not db.query(User).filter(User.username == 'admin').first():
            db.add_all([
                User(username='admin', email='admin@cyberstream.io', password_hash=hash_password('admin123'), role=RoleEnum.ADMIN),
                User(username='analyst', email='analyst@cyberstream.io', password_hash=hash_password('analyst123'), role=RoleEnum.ANALYST),
                User(username='viewer', email='viewer@cyberstream.io', password_hash=hash_password('viewer123'), role=RoleEnum.VIEWER)
            ])
            
        # Seed Servers
        if not db.query(Server).first():
            servers = [
                Server(server_id=f"SRV-00{i}", hostname=f"web-{i}.prod", ip_address=f"10.0.1.{i}", environment=EnvironmentEnum.PRODUCTION, os_type="Linux") for i in range(1, 5)
            ] + [
                Server(server_id=f"SRV-00{i}", hostname=f"db-{i-4}.prod", ip_address=f"10.0.1.{i}", environment=EnvironmentEnum.PRODUCTION, os_type="Linux") for i in range(5, 7)
            ] + [
                Server(server_id="SRV-007", hostname="app-1.stage", ip_address="10.0.1.7", environment=EnvironmentEnum.STAGING, os_type="Windows"),
                Server(server_id="SRV-008", hostname="dev-1.dev", ip_address="10.0.1.8", environment=EnvironmentEnum.DEVELOPMENT, os_type="Linux")
            ]
            db.add_all(servers)
            
        # Seed Rules
        if not db.query(SecurityRule).first():
            rules = [
                SecurityRule(name="Brute Force Detection", description=">10 LOGIN_FAILURE from same IP in 300s", rule_type="aggregation", condition_field="event_type", condition_operator="==", threshold=10, time_window_seconds=300, severity="HIGH", group_by_field="source_ip"),
                SecurityRule(name="Excessive Access Denied", description=">20 ACCESS_DENIED from same user in 600s", rule_type="aggregation", condition_field="event_type", condition_operator="==", threshold=20, time_window_seconds=600, severity="HIGH", group_by_field="username"),
                SecurityRule(name="High Request Rate", description=">50 requests from same IP in 10s", rule_type="aggregation", condition_field="event_type", condition_operator="==", threshold=50, time_window_seconds=10, severity="MEDIUM", group_by_field="source_ip"),
                SecurityRule(name="Suspicious Source", description=">15 FIREWALL_BLOCK from same IP in 300s", rule_type="aggregation", condition_field="event_type", condition_operator="==", threshold=15, time_window_seconds=300, severity="HIGH", group_by_field="source_ip"),
                SecurityRule(name="Server Error Spike", description=">20 SERVER_ERROR from same server in 300s", rule_type="aggregation", condition_field="event_type", condition_operator="==", threshold=20, time_window_seconds=300, severity="CRITICAL", group_by_field="server_id"),
                SecurityRule(name="Credential Attack Pattern", description=">5 LOGIN_FAILURE with different usernames from same IP in 300s", rule_type="aggregation", condition_field="event_type", condition_operator="==", threshold=5, time_window_seconds=300, severity="CRITICAL", group_by_field="source_ip"),
                SecurityRule(name="DNS Security Event", description=">10 DNS_BLOCK from same IP in 600s", rule_type="aggregation", condition_field="event_type", condition_operator="==", threshold=10, time_window_seconds=600, severity="MEDIUM", group_by_field="source_ip"),
                SecurityRule(name="Database Access Violation", description=">10 ACCESS_DENIED with DATABASE_ACCESS from same user in 600s", rule_type="aggregation", condition_field="event_type", condition_operator="==", threshold=10, time_window_seconds=600, severity="HIGH", group_by_field="username")
            ]
            db.add_all(rules)
            
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
    print("Database seeded.")
