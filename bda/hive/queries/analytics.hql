USE cyberstream;

SELECT severity, COUNT(1) AS total_events
FROM cyber_events_all
GROUP BY severity
ORDER BY total_events DESC;

SELECT substr(`timestamp`, 1, 13) AS hour_utc, COUNT(1) AS total_events
FROM cyber_events_all
GROUP BY substr(`timestamp`, 1, 13)
ORDER BY hour_utc;

SELECT source_ip, COUNT(1) AS failed_attempts
FROM cyber_events_all
WHERE event_type IN ('authentication', 'ssh') AND action = 'failed'
GROUP BY source_ip
ORDER BY failed_attempts DESC
LIMIT 10;

SELECT event_type, COUNT(1) AS total_events
FROM cyber_events_all
GROUP BY event_type
ORDER BY total_events DESC;

SELECT protocol, AVG(bytes) AS average_bytes
FROM cyber_events_all
GROUP BY protocol
ORDER BY average_bytes DESC;
