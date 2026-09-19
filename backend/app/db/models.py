import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, BigInteger, JSON, Index, Enum
from sqlalchemy.sql import func
from app.db.database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

class AlertStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

class EnvironmentEnum(str, enum.Enum):
    PRODUCTION = "PRODUCTION"
    STAGING = "STAGING"
    DEVELOPMENT = "DEVELOPMENT"

class ServerStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"

class RiskLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.username}>"

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, unique=True, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    event_type = Column(String, nullable=False)
    source_ip = Column(String, nullable=False)
    destination_ip = Column(String)
    source_port = Column(Integer)
    destination_port = Column(Integer)
    username = Column(String)
    service = Column(String)
    endpoint = Column(String)
    http_method = Column(String)
    status_code = Column(Integer)
    response_time_ms = Column(Float)
    country = Column(String)
    city = Column(String)
    severity = Column(String)
    server_id = Column(String)
    metadata_ = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

Index('ix_events_timestamp', Event.timestamp)
Index('ix_events_event_type', Event.event_type)
Index('ix_events_source_ip', Event.source_ip)
Index('ix_events_username', Event.username)
Index('ix_events_server_id', Event.server_id)
Index('ix_events_severity', Event.severity)

class SecurityAlert(Base):
    __tablename__ = "security_alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    rule_id = Column(Integer, nullable=False)
    rule_name = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    source_ip = Column(String)
    username = Column(String)
    server_id = Column(String)
    description = Column(String)
    status = Column(Enum(AlertStatusEnum), default=AlertStatusEnum.OPEN)
    first_seen = Column(DateTime(timezone=True))
    last_seen = Column(DateTime(timezone=True))
    event_count = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

Index('ix_security_alerts_timestamp', SecurityAlert.timestamp)
Index('ix_security_alerts_severity', SecurityAlert.severity)
Index('ix_security_alerts_status', SecurityAlert.status)
Index('ix_security_alerts_source_ip', SecurityAlert.source_ip)

class SecurityRule(Base):
    __tablename__ = "security_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    rule_type = Column(String, nullable=False)
    condition_field = Column(String, nullable=False)
    condition_operator = Column(String, nullable=False)
    threshold = Column(Integer, nullable=False)
    time_window_seconds = Column(Integer, nullable=False)
    severity = Column(String, nullable=False)
    group_by_field = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Server(Base):
    __tablename__ = "servers"
    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(String, unique=True, index=True, nullable=False)
    hostname = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    environment = Column(Enum(EnvironmentEnum), nullable=False)
    status = Column(Enum(ServerStatusEnum), default=ServerStatusEnum.ACTIVE)
    os_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class IPAddress(Base):
    __tablename__ = "ip_addresses"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True, nullable=False)
    country = Column(String)
    city = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    total_events = Column(Integer, default=0)
    failed_events = Column(Integer, default=0)
    blocked_events = Column(Integer, default=0)
    first_seen = Column(DateTime(timezone=True))
    last_seen = Column(DateTime(timezone=True))
    risk_level = Column(Enum(RiskLevelEnum), default=RiskLevelEnum.LOW)

class EventStatistic(Base):
    __tablename__ = "event_statistics"
    id = Column(Integer, primary_key=True, index=True)
    window_start = Column(DateTime(timezone=True), nullable=False)
    window_end = Column(DateTime(timezone=True), nullable=False)
    window_size = Column(String, nullable=False)
    event_type = Column(String)
    event_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    blocked_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    unique_ips = Column(Integer, default=0)
    unique_users = Column(Integer, default=0)
    average_response_time = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

Index('ix_event_statistics_window_start_size', EventStatistic.window_start, EventStatistic.window_size)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String, nullable=False)
    action = Column(String, nullable=False)
    resource = Column(String)
    resource_id = Column(String)
    ip_address = Column(String)
    details = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
