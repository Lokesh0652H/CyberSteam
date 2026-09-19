import random
import uuid
import time
from datetime import datetime, timezone
from app.schemas import CyberEvent
from app.data_pools import ATTACKER_IPS, INTERNAL_IPS, EXTERNAL_IPS, USERNAMES, SERVERS, ip_to_geo

class AttackScenarioManager:
    def __init__(self):
        self.scenarios_triggered = 0
        self.current_scenario = None
        
    def generate_scenario_events(self, scenario_name):
        self.scenarios_triggered += 1
        self.current_scenario = scenario_name
        events = []
        
        if scenario_name == 'brute_force':
            # Scenario 1: Brute Force Attack
            attacker_ip = random.choice(ATTACKER_IPS)
            country, city = ip_to_geo(attacker_ip)
            target_server = "SRV-007" # auth-prod-01
            for i in range(20):
                events.append(CyberEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:12]}",
                    timestamp=datetime.now(timezone.utc),
                    event_type="LOGIN_FAILURE",
                    source_ip=attacker_ip,
                    destination_ip="10.0.1.5",
                    source_port=random.randint(1024, 65535),
                    destination_port=443,
                    username="admin",
                    service="authentication",
                    endpoint="/login",
                    http_method="POST",
                    status_code=401,
                    response_time_ms=random.randint(20, 50),
                    country=country,
                    city=city,
                    severity="MEDIUM",
                    server_id=target_server
                ))
                
        elif scenario_name == 'credential_stuffing':
            # Scenario 2: Credential Stuffing
            attacker_ip = random.choice(ATTACKER_IPS)
            country, city = ip_to_geo(attacker_ip)
            usernames = random.sample(USERNAMES, 10)
            for user in usernames:
                events.append(CyberEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:12]}",
                    timestamp=datetime.now(timezone.utc),
                    event_type="LOGIN_FAILURE",
                    source_ip=attacker_ip,
                    destination_ip="10.0.1.5",
                    source_port=random.randint(1024, 65535),
                    destination_port=443,
                    username=user,
                    service="authentication",
                    endpoint="/login",
                    http_method="POST",
                    status_code=401,
                    response_time_ms=random.randint(20, 50),
                    country=country,
                    city=city,
                    severity="MEDIUM",
                    server_id="SRV-007"
                ))
                
        elif scenario_name == 'ddos':
            # Scenario 3: DDoS / High Request Rate
            attacker_ip = random.choice(ATTACKER_IPS)
            country, city = ip_to_geo(attacker_ip)
            for i in range(70):
                events.append(CyberEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:12]}",
                    timestamp=datetime.now(timezone.utc),
                    event_type="HTTP_REQUEST",
                    source_ip=attacker_ip,
                    destination_ip="10.0.1.10",
                    source_port=random.randint(1024, 65535),
                    destination_port=443,
                    service="web-server",
                    endpoint="/",
                    http_method="GET",
                    status_code=200,
                    response_time_ms=random.randint(200, 1000),
                    country=country,
                    city=city,
                    severity="INFO",
                    server_id="SRV-001"
                ))
                
        elif scenario_name == 'port_scan':
            # Scenario 4: Port Scan / Firewall Attack
            attacker_ip = random.choice(ATTACKER_IPS)
            country, city = ip_to_geo(attacker_ip)
            for port in range(1, 25):
                events.append(CyberEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:12]}",
                    timestamp=datetime.now(timezone.utc),
                    event_type="FIREWALL_BLOCK",
                    source_ip=attacker_ip,
                    destination_ip="10.0.1.1",
                    source_port=random.randint(1024, 65535),
                    destination_port=port,
                    service="firewall",
                    country=country,
                    city=city,
                    severity="HIGH",
                    server_id="SRV-001"
                ))
                
        elif scenario_name == 'server_error_spike':
            # Scenario 5: Server Error Spike
            target_server = "SRV-003"
            for i in range(30):
                source_ip = random.choice(EXTERNAL_IPS)
                country, city = ip_to_geo(source_ip)
                events.append(CyberEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:12]}",
                    timestamp=datetime.now(timezone.utc),
                    event_type="SERVER_ERROR",
                    source_ip=source_ip,
                    destination_ip="10.0.1.15",
                    source_port=random.randint(1024, 65535),
                    destination_port=443,
                    service="api-gateway",
                    endpoint="/api/data",
                    http_method="GET",
                    status_code=500,
                    response_time_ms=random.randint(500, 2000),
                    country=country,
                    city=city,
                    severity="HIGH",
                    server_id=target_server
                ))
                
        elif scenario_name == 'dns_attack':
            # Scenario 6: DNS Attack
            attacker_ip = random.choice(EXTERNAL_IPS)
            country, city = ip_to_geo(attacker_ip)
            for i in range(20):
                events.append(CyberEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:12]}",
                    timestamp=datetime.now(timezone.utc),
                    event_type="DNS_BLOCK",
                    source_ip=attacker_ip,
                    destination_ip="8.8.8.8",
                    source_port=random.randint(1024, 65535),
                    destination_port=53,
                    service="dns-resolver",
                    country=country,
                    city=city,
                    severity="HIGH",
                    server_id="SRV-001",
                    metadata={"domain": random.choice(["malware-c2.example.com", "phishing-site.example.net"])}
                ))
                
        elif scenario_name == 'database_violation':
            # Scenario 7: Database Violation
            user = random.choice(USERNAMES)
            source_ip = random.choice(INTERNAL_IPS)
            country, city = ip_to_geo(source_ip)
            for i in range(16):
                events.append(CyberEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:12]}",
                    timestamp=datetime.now(timezone.utc),
                    event_type=random.choice(["ACCESS_DENIED", "DATABASE_ACCESS"]),
                    source_ip=source_ip,
                    destination_ip="10.0.1.20",
                    source_port=random.randint(1024, 65535),
                    destination_port=5432,
                    username=user,
                    service="database",
                    endpoint="/admin",
                    status_code=403,
                    country=country,
                    city=city,
                    severity="HIGH",
                    server_id="SRV-005"
                ))
                
        elif scenario_name == 'excessive_access_denied':
            # Scenario 8: Excessive Access Denied
            user = random.choice(USERNAMES)
            source_ip = random.choice(EXTERNAL_IPS)
            country, city = ip_to_geo(source_ip)
            for i in range(30):
                events.append(CyberEvent(
                    event_id=f"evt_{uuid.uuid4().hex[:12]}",
                    timestamp=datetime.now(timezone.utc),
                    event_type="ACCESS_DENIED",
                    source_ip=source_ip,
                    destination_ip="10.0.1.10",
                    source_port=random.randint(1024, 65535),
                    destination_port=443,
                    username=user,
                    service="web-server",
                    endpoint="/admin",
                    http_method="GET",
                    status_code=403,
                    country=country,
                    city=city,
                    severity="MEDIUM",
                    server_id="SRV-001"
                ))
                
        return events
