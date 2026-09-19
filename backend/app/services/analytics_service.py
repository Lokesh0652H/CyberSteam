from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.db.models import Event, SecurityAlert, Server, IPAddress
from app.schemas.analytics import DashboardSummary, MetricValue, AuthAnalytics, FirewallAnalytics, HttpAnalytics, GeoAnalytics

def get_dashboard_summary(db: Session) -> DashboardSummary:
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    two_hours_ago = now - timedelta(hours=2)
    
    # helper for metrics
    def get_metric(model, count_filter=None, time_field=None):
        if time_field is None:
            time_field = model.timestamp
            
        q_current = db.query(func.count(model.id)).filter(time_field >= one_hour_ago)
        q_prev = db.query(func.count(model.id)).filter(time_field >= two_hours_ago, time_field < one_hour_ago)
        
        if count_filter is not None:
            q_current = q_current.filter(count_filter)
            q_prev = q_prev.filter(count_filter)
            
        cur_val = q_current.scalar() or 0
        prev_val = q_prev.scalar() or 0
        trend = "up" if cur_val > prev_val else "down" if cur_val < prev_val else "stable"
        
        return MetricValue(current_value=cur_val, previous_value=prev_val, trend=trend, last_updated=now.isoformat())

    eps = get_metric(Event)
    eps.current_value = round(eps.current_value / 3600.0, 2)
    eps.previous_value = round(eps.previous_value / 3600.0, 2)
    
    return DashboardSummary(
        total_events=get_metric(Event),
        events_per_second=eps,
        active_alerts=get_metric(SecurityAlert, SecurityAlert.status == "OPEN"),
        critical_alerts=get_metric(SecurityAlert, SecurityAlert.severity == "CRITICAL"),
        failed_logins=get_metric(Event, Event.event_type == "LOGIN_FAILURE"),
        blocked_requests=get_metric(Event, Event.event_type.in_(["FIREWALL_BLOCK", "ACCESS_DENIED"])),
        active_servers=MetricValue(current_value=db.query(Server).count(), previous_value=db.query(Server).count(), trend="stable", last_updated=now.isoformat()),
        unique_source_ips=MetricValue(
            current_value=db.query(func.count(func.distinct(Event.source_ip))).filter(Event.timestamp >= one_hour_ago).scalar() or 0,
            previous_value=db.query(func.count(func.distinct(Event.source_ip))).filter(Event.timestamp >= two_hours_ago, Event.timestamp < one_hour_ago).scalar() or 0,
            trend="stable", last_updated=now.isoformat()
        )
    )

def get_auth_analytics(db: Session, hours: int = 24) -> AuthAnalytics:
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    total_logins = db.query(func.count(Event.id)).filter(Event.event_type.in_(["LOGIN_SUCCESS", "LOGIN_FAILURE"]), Event.timestamp >= start_time).scalar() or 0
    success_logins = db.query(func.count(Event.id)).filter(Event.event_type == "LOGIN_SUCCESS", Event.timestamp >= start_time).scalar() or 0
    
    failed_by_user = db.query(Event.username, func.count(Event.id).label('count')).filter(Event.event_type == "LOGIN_FAILURE", Event.timestamp >= start_time).group_by(Event.username).order_by(func.count(Event.id).desc()).limit(10).all()
    
    return AuthAnalytics(
        total_logins=total_logins,
        success_rate=round(success_logins / total_logins * 100, 2) if total_logins > 0 else 0,
        failed_logins_by_user=[{"username": u, "count": c} for u, c in failed_by_user],
        brute_force_attempts=db.query(func.count(SecurityAlert.id)).filter(SecurityAlert.rule_name == "Brute Force Detection", SecurityAlert.timestamp >= start_time).scalar() or 0
    )

def get_firewall_analytics(db: Session, hours: int = 24) -> FirewallAnalytics:
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    total_blocked = db.query(func.count(Event.id)).filter(
        Event.event_type == "FIREWALL_BLOCK",
        Event.timestamp >= start_time
    ).scalar() or 0
    
    total_allowed = db.query(func.count(Event.id)).filter(
        Event.event_type == "FIREWALL_ALLOW",
        Event.timestamp >= start_time
    ).scalar() or 0
    
    top_blocked_ips = db.query(
        Event.source_ip,
        func.count(Event.id).label('count')
    ).filter(
        Event.event_type == "FIREWALL_BLOCK",
        Event.timestamp >= start_time
    ).group_by(Event.source_ip).order_by(func.count(Event.id).desc()).limit(10).all()
    
    blocked_by_country = db.query(
        Event.country,
        func.count(Event.id).label('count')
    ).filter(
        Event.event_type == "FIREWALL_BLOCK",
        Event.timestamp >= start_time
    ).group_by(Event.country).order_by(func.count(Event.id).desc()).limit(10).all()
    
    return FirewallAnalytics(
        total_blocked=total_blocked,
        total_allowed=total_allowed,
        top_blocked_ips=[{"ip": ip, "count": c} for ip, c in top_blocked_ips],
        blocked_by_country=[{"country": co, "count": c} for co, c in blocked_by_country]
    )

def get_http_analytics(db: Session, hours: int = 24) -> HttpAnalytics:
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    total_requests = db.query(func.count(Event.id)).filter(
        Event.event_type.in_(["HTTP_REQUEST", "API_REQUEST"]),
        Event.timestamp >= start_time
    ).scalar() or 0
    
    error_count = db.query(func.count(Event.id)).filter(
        Event.event_type.in_(["HTTP_REQUEST", "API_REQUEST"]),
        Event.status_code >= 500,
        Event.timestamp >= start_time
    ).scalar() or 0
    
    avg_response = db.query(func.avg(Event.response_time_ms)).filter(
        Event.event_type.in_(["HTTP_REQUEST", "API_REQUEST"]),
        Event.response_time_ms.isnot(None),
        Event.timestamp >= start_time
    ).scalar() or 0.0
    
    status_distribution = db.query(
        Event.status_code,
        func.count(Event.id).label('count')
    ).filter(
        Event.event_type.in_(["HTTP_REQUEST", "API_REQUEST"]),
        Event.status_code.isnot(None),
        Event.timestamp >= start_time
    ).group_by(Event.status_code).order_by(func.count(Event.id).desc()).limit(10).all()
    
    top_endpoints = db.query(
        Event.endpoint,
        func.count(Event.id).label('count')
    ).filter(
        Event.event_type.in_(["HTTP_REQUEST", "API_REQUEST"]),
        Event.endpoint.isnot(None),
        Event.timestamp >= start_time
    ).group_by(Event.endpoint).order_by(func.count(Event.id).desc()).limit(10).all()
    
    return HttpAnalytics(
        total_requests=total_requests,
        error_rate=round(error_count / total_requests * 100, 2) if total_requests > 0 else 0.0,
        avg_response_time=round(float(avg_response), 2),
        status_distribution=[{"status_code": sc, "count": c} for sc, c in status_distribution],
        top_endpoints=[{"endpoint": ep, "count": c} for ep, c in top_endpoints]
    )

def get_geo_analytics(db: Session) -> GeoAnalytics:
    events_by_country = db.query(
        Event.country,
        func.count(Event.id).label('event_count'),
        func.count(func.distinct(Event.source_ip)).label('ip_count')
    ).filter(
        Event.country.isnot(None)
    ).group_by(Event.country).order_by(func.count(Event.id).desc()).limit(20).all()
    
    # Get coordinates from ip_addresses table for geo visualization
    geo_points = db.query(
        IPAddress.country,
        IPAddress.city,
        IPAddress.latitude,
        IPAddress.longitude,
        IPAddress.total_events,
        IPAddress.blocked_events
    ).filter(
        IPAddress.latitude.isnot(None),
        IPAddress.longitude.isnot(None)
    ).limit(200).all()
    
    return GeoAnalytics(
        events_by_country=[{"country": c, "event_count": ec, "ip_count": ic} for c, ec, ic in events_by_country],
        geo_points=[{
            "country": p.country, "city": p.city,
            "lat": p.latitude, "lng": p.longitude,
            "events": p.total_events, "blocked": p.blocked_events
        } for p in geo_points],
        high_risk_countries=[c for c, ec, _ in events_by_country[:5]]
    )

