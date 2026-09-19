-- 1. Top 10 source IPs by event count
SELECT source_ip, COUNT(*) as event_count 
FROM cyber_events 
GROUP BY source_ip 
ORDER BY event_count DESC 
LIMIT 10;

-- 2. Event type distribution
SELECT event_type, COUNT(*) as cnt 
FROM cyber_events 
GROUP BY event_type 
ORDER BY cnt DESC;

-- 3. Hourly authentication failure rate
SELECT year, month, day, hour, COUNT(*) as failed_logins 
FROM cyber_events 
WHERE event_type = 'LOGIN_FAILURE' 
GROUP BY year, month, day, hour 
ORDER BY year, month, day, hour;

-- 4. Top attacked servers
SELECT server_id, COUNT(*) as attack_count 
FROM cyber_events 
WHERE event_type IN ('LOGIN_FAILURE', 'ACCESS_DENIED', 'FIREWALL_BLOCK') 
GROUP BY server_id 
ORDER BY attack_count DESC 
LIMIT 5;

-- 5. HTTP status code distribution
SELECT status_code, COUNT(*) as cnt 
FROM cyber_events 
WHERE status_code IS NOT NULL 
GROUP BY status_code 
ORDER BY cnt DESC;

-- 6. Average response time by service
SELECT service, AVG(response_time_ms) as avg_response_time_ms 
FROM cyber_events 
WHERE response_time_ms IS NOT NULL 
GROUP BY service 
ORDER BY avg_response_time_ms DESC;

-- 7. Geographic distribution of events
SELECT country, city, COUNT(*) as event_count 
FROM cyber_events 
GROUP BY country, city 
ORDER BY event_count DESC 
LIMIT 15;

-- 8. Most active users
SELECT username, COUNT(*) as activity_count 
FROM cyber_events 
WHERE username IS NOT NULL 
GROUP BY username 
ORDER BY activity_count DESC 
LIMIT 10;

-- 9. Firewall block statistics by hour
SELECT year, month, day, hour, destination_port, COUNT(*) as blocks 
FROM cyber_events 
WHERE event_type = 'FIREWALL_BLOCK' 
GROUP BY year, month, day, hour, destination_port 
ORDER BY year, month, day, hour DESC, blocks DESC 
LIMIT 20;

-- 10. Daily security event trend
SELECT year, month, day, severity, COUNT(*) as event_count 
FROM cyber_events 
GROUP BY year, month, day, severity 
ORDER BY year, month, day, severity;
