import random
import uuid
from datetime import datetime, timezone
from app.schemas import CyberEvent
from app.data_pools import (INTERNAL_IPS, EXTERNAL_IPS, ATTACKER_IPS, USERNAMES,
                            SERVERS, SERVICES, ENDPOINTS, ip_to_geo)

class EventGenerator:
    def __init__(self):
        self.active_sessions = {}
        
    def generate_event(self) -> CyberEvent:
        event_type = random.choices(
            ['HTTP_REQUEST', 'API_REQUEST', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 
             'FIREWALL_ALLOW', 'FIREWALL_BLOCK', 'DNS_REQUEST', 'DNS_BLOCK',
             'DATABASE_ACCESS', 'SESSION_START', 'SESSION_END', 'LOGOUT', 
             'PASSWORD_CHANGE', 'ACCESS_DENIED', 'SERVER_ERROR'],
            weights=[30, 20, 12, 5, 10, 3, 8, 1, 4, 2, 2, 1, 0.5, 1, 0.5],
            k=1
        )[0]

        source_ip = random.choice(INTERNAL_IPS if random.random() < 0.3 else EXTERNAL_IPS)
        destination_ip = random.choice(INTERNAL_IPS)
        source_port = random.randint(1024, 65535)
        destination_port = 443
        username = None
        service = "web-server"
        endpoint = None
        http_method = None
        status_code = None
        response_time_ms = None
        severity = "INFO"
        server_id = random.choice(list(SERVERS.keys()))
        metadata = {}

        if event_type in ['LOGIN_SUCCESS', 'LOGIN_FAILURE']:
            service = "authentication"
            endpoint = "/login"
            http_method = "POST"
            username = random.choice(USERNAMES)
            server_id = "SRV-007" if random.random() < 0.5 else "SRV-008"
            if event_type == 'LOGIN_SUCCESS':
                status_code = 200
                response_time_ms = random.randint(50, 200)
                if username not in self.active_sessions:
                    self.active_sessions[username] = source_ip
                else:
                    source_ip = self.active_sessions[username] # keep IP consistent
            else:
                status_code = random.choice([401, 403])
                response_time_ms = random.randint(20, 100)
                severity = "MEDIUM"

        elif event_type == 'LOGOUT':
            service = "authentication"
            endpoint = "/logout"
            http_method = "POST"
            if self.active_sessions:
                username = random.choice(list(self.active_sessions.keys()))
                source_ip = self.active_sessions.pop(username)
            else:
                username = random.choice(USERNAMES)
            status_code = 200
            response_time_ms = random.randint(20, 100)
            server_id = "SRV-007" if random.random() < 0.5 else "SRV-008"

        elif event_type == 'API_REQUEST':
            service = "api-gateway"
            endpoint = random.choice([e for e in ENDPOINTS if e.startswith("/api/")])
            http_method = random.choice(["GET", "POST", "PUT", "DELETE"])
            status_code = random.choices([200, 201, 204, 400, 404, 500], weights=[70, 10, 5, 5, 8, 2])[0]
            response_time_ms = random.randint(100, 500)
            server_id = "SRV-003" if random.random() < 0.5 else "SRV-004"
            if self.active_sessions and random.random() < 0.8:
                username = random.choice(list(self.active_sessions.keys()))
                source_ip = self.active_sessions[username]

        elif event_type == 'HTTP_REQUEST':
            service = "web-server"
            endpoint = random.choice([e for e in ENDPOINTS if not e.startswith("/api/")])
            http_method = random.choice(["GET", "POST"])
            status_code = random.choices([200, 301, 404, 500], weights=[85, 10, 4, 1])[0]
            response_time_ms = random.randint(50, 500)
            server_id = "SRV-001" if random.random() < 0.5 else "SRV-002"
            
        elif event_type == 'FIREWALL_BLOCK':
            service = "firewall"
            source_ip = random.choice(EXTERNAL_IPS)
            destination_port = random.choice([22, 3389, 23, 445])
            severity = random.choice(["MEDIUM", "HIGH"])
            
        elif event_type == 'FIREWALL_ALLOW':
            service = "firewall"
            destination_port = random.choice([80, 443])
            
        elif event_type == 'DNS_REQUEST':
            service = "dns-resolver"
            destination_port = 53
            metadata={"domain": "example.com"}
            
        elif event_type == 'DNS_BLOCK':
            service = "dns-resolver"
            destination_port = 53
            severity = "HIGH"
            metadata={"domain": random.choice(["malware-c2.example.com", "phishing-site.example.net"])}
            
        elif event_type == 'DATABASE_ACCESS':
            service = "database"
            source_ip = random.choice(INTERNAL_IPS)
            endpoint = random.choice(["/query", "/admin"])
            severity = random.choice(["INFO", "LOW"])
            server_id = "SRV-005" if random.random() < 0.5 else "SRV-006"
            response_time_ms = random.randint(20, 100)
            
        elif event_type in ['SESSION_START', 'SESSION_END']:
            service = "authentication"
            if self.active_sessions:
                username = random.choice(list(self.active_sessions.keys()))
                source_ip = self.active_sessions[username]
            else:
                username = random.choice(USERNAMES)
                
        elif event_type == 'PASSWORD_CHANGE':
            service = "authentication"
            username = random.choice(USERNAMES)
            severity = "LOW"
            
        elif event_type == 'ACCESS_DENIED':
            status_code = 403
            severity = "MEDIUM"
            if self.active_sessions:
                username = random.choice(list(self.active_sessions.keys()))
                source_ip = self.active_sessions[username]
                
        elif event_type == 'SERVER_ERROR':
            status_code = random.choice([500, 502, 503])
            severity = "HIGH"
            server_id = "SRV-003"
            
        country, city = ip_to_geo(source_ip)
        
        return CyberEvent(
            event_id=f"evt_{uuid.uuid4().hex[:12]}",
            timestamp=datetime.now(timezone.utc),
            event_type=event_type,
            source_ip=source_ip,
            destination_ip=destination_ip,
            source_port=source_port,
            destination_port=destination_port,
            username=username,
            service=service,
            endpoint=endpoint,
            http_method=http_method,
            status_code=status_code,
            response_time_ms=response_time_ms,
            country=country,
            city=city,
            severity=severity,
            server_id=server_id,
            metadata=metadata
        )
