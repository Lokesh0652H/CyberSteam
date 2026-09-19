import random

INTERNAL_IPS = [f"10.0.1.{i}" for i in range(1, 26)] + \
               [f"10.0.2.{i}" for i in range(1, 26)] + \
               [f"192.168.1.{i}" for i in range(1, 10)]

EXTERNAL_IPS = [
    "203.0.113.5", "203.0.113.12", "203.0.113.45", "198.51.100.18", "198.51.100.56",
    "192.0.2.14", "192.0.2.89", "8.8.8.8", "1.1.1.1", "104.28.14.49",
    "172.217.14.206", "142.250.190.46", "31.13.71.36", "157.240.22.35"
    # More realistic external IPs can be added here
]
for _ in range(85):
    EXTERNAL_IPS.append(f"{random.randint(11,200)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}")

ATTACKER_IPS = ["45.33.32.156", "185.150.14.20", "221.194.47.243", "46.101.12.15", "178.62.193.28",
                "89.248.167.131", "195.154.212.181", "141.212.122.146", "218.92.0.201", "118.24.150.155"]

USERNAMES = ["admin", "root", "jsmith", "agarcia", "mchen", "djones", "swilliams", "mbrown", "jwilson", "kmoore",
             "ttaylor", "aanderson", "jthomas", "mjackson", "ewhite", "hharris", "smartin", "jthompson", "cgarcia",
             "amartinez", "rrobinson", "cclark", "drodriguez", "llewis", "plee", "awalker", "jhall", "aallen", "yyoung", "bhernandez"]

SERVERS = {
    "SRV-001": "web-prod-01",
    "SRV-002": "web-prod-02",
    "SRV-003": "api-prod-01",
    "SRV-004": "api-prod-02",
    "SRV-005": "db-prod-01",
    "SRV-006": "db-prod-02",
    "SRV-007": "auth-prod-01",
    "SRV-008": "auth-prod-02",
}

SERVICES = ["authentication", "web-server", "api-gateway", "database", "firewall", "dns-resolver", "file-server", "mail-server"]

ENDPOINTS = ["/login", "/logout", "/api/users", "/api/data", "/api/reports", "/health", "/admin", "/api/upload", "/dashboard", "/query"]

GEO_POOL = {
    "US": ["New York", "San Francisco", "Chicago", "Dallas"],
    "IN": ["Mumbai", "Delhi", "Bangalore", "Chennai"],
    "DE": ["Berlin", "Munich", "Frankfurt"],
    "CN": ["Beijing", "Shanghai"],
    "RU": ["Moscow", "St Petersburg"],
    "BR": ["São Paulo", "Rio"],
    "GB": ["London", "Manchester"],
    "JP": ["Tokyo", "Osaka"],
    "KR": ["Seoul"],
    "AU": ["Sydney", "Melbourne"]
}

def get_random_geo():
    country = random.choice(list(GEO_POOL.keys()))
    city = random.choice(GEO_POOL[country])
    return country, city

def ip_to_geo(ip):
    # Deterministic mapping for IPs
    random.seed(ip)
    country = random.choice(list(GEO_POOL.keys()))
    city = random.choice(GEO_POOL[country])
    random.seed()
    return country, city
