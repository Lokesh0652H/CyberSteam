export const SEVERITY_LEVELS = {
  CRITICAL: { label: 'Critical', color: 'var(--severity-critical)', bg: 'var(--severity-critical-bg)' },
  HIGH: { label: 'High', color: 'var(--severity-high)', bg: 'var(--severity-high-bg)' },
  MEDIUM: { label: 'Medium', color: 'var(--severity-medium)', bg: 'var(--severity-medium-bg)' },
  LOW: { label: 'Low', color: 'var(--severity-low)', bg: 'var(--severity-low-bg)' },
  INFO: { label: 'Info', color: 'var(--severity-info)', bg: 'var(--severity-info-bg)' },
};

export const SYSTEM_STATUS = {
  CONNECTED: { label: 'Connected', color: 'var(--status-active)' },
  DISCONNECTED: { label: 'Disconnected', color: 'var(--status-error)' },
  RECONNECTING: { label: 'Reconnecting', color: 'var(--status-warning)' },
  PROCESSING: { label: 'Processing', color: 'var(--accent-secondary)' },
  DEGRADED: { label: 'Degraded', color: 'var(--status-warning)' },
};

export const EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'ACCESS_DENIED',
  'FIREWALL_BLOCK',
  'FIREWALL_ALLOW',
  'HTTP_REQUEST',
  'API_REQUEST',
  'SERVER_ERROR',
  'DNS_BLOCK',
  'PORT_SCAN',
  'MALWARE_DETECTED',
  'DATA_EXFILTRATION',
];

export const ALERT_STATUSES = [
  'OPEN',
  'ACKNOWLEDGED',
  'INVESTIGATING',
  'RESOLVED',
  'FALSE_POSITIVE',
];

export const WS_BASE_URL = 'ws://localhost:8000';
export const API_POLL_INTERVAL = 5000;
