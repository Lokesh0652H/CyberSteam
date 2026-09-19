from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class MetricValue(BaseModel):
    current_value: float
    previous_value: float
    trend: str
    last_updated: str

class DashboardSummary(BaseModel):
    total_events: MetricValue
    events_per_second: MetricValue
    active_alerts: MetricValue
    critical_alerts: MetricValue
    failed_logins: MetricValue
    blocked_requests: MetricValue
    active_servers: MetricValue
    unique_source_ips: MetricValue

class AuthAnalytics(BaseModel):
    total_logins: int
    success_rate: float
    failed_logins_by_user: List[Dict[str, Any]]
    brute_force_attempts: int

class FirewallAnalytics(BaseModel):
    total_blocked: int
    total_allowed: int = 0
    top_blocked_ips: List[Dict[str, Any]]
    blocked_by_country: List[Dict[str, Any]]

class HttpAnalytics(BaseModel):
    total_requests: int
    error_rate: float
    avg_response_time: float
    status_distribution: List[Dict[str, Any]] = []
    top_endpoints: List[Dict[str, Any]]

class GeoAnalytics(BaseModel):
    events_by_country: List[Dict[str, Any]]
    geo_points: List[Dict[str, Any]] = []
    high_risk_countries: List[str]

class ServerAnalyticsDetail(BaseModel):
    server_id: str
    hostname: str
    status: str
    environment: str
    total_events: int = 0
    error_count: int = 0
    error_rate: float = 0.0
    avg_response_time: float = 0.0
    alert_count: int = 0
    last_activity: Optional[str] = None

ServerAnalytics = ServerAnalyticsDetail

class IPAnalyticsDetail(BaseModel):
    ip_address: str
    country: Optional[str] = None
    city: Optional[str] = None
    total_events: int = 0
    failed_events: int = 0
    blocked_events: int = 0
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None
    risk_level: str = "LOW"
    event_types: List[Dict[str, Any]] = []
    targeted_servers: List[str] = []
    associated_alerts: List[Dict[str, Any]] = []

IPAnalytics = IPAnalyticsDetail
