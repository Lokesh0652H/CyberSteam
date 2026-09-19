import api from './axios';

// Dashboard
export const getDashboardSummary = () => api.get('/api/dashboard/summary');

// Events
export const getEvents = (params) => api.get('/api/events', { params });
export const getRecentEvents = (limit = 50) => api.get('/api/events/recent', { params: { limit } });
export const getEventStats = (window = '1h') => api.get('/api/events/stats', { params: { window } });
export const getEventTimeline = (hours = 24) => api.get('/api/events/timeline', { params: { hours } });
export const exportEventsCsv = (params) => api.get('/api/events/export/csv', { params, responseType: 'blob' });

// Alerts
export const getAlerts = (params) => api.get('/api/alerts', { params });
export const getAlertStats = () => api.get('/api/alerts/stats');
export const getAlertById = (id) => api.get(`/api/alerts/${id}`);
export const updateAlert = (id, data) => api.patch(`/api/alerts/${id}`, data);

// IPs
export const getIps = (params) => api.get('/api/ips', { params });
export const getIpDetails = (ip) => api.get(`/api/ips/${ip}`);

// Servers
export const getServers = () => api.get('/api/servers');
export const getServerDetails = (id) => api.get(`/api/servers/${id}`);

// Analytics
export const getAuthAnalytics = (hours = 24) => api.get('/api/analytics/authentication', { params: { hours } });
export const getFirewallAnalytics = (hours = 24) => api.get('/api/analytics/firewall', { params: { hours } });
export const getHttpAnalytics = (hours = 24) => api.get('/api/analytics/http', { params: { hours } });
export const getGeoAnalytics = () => api.get('/api/analytics/geography');

// Pipeline & System
export const getSystemHealth = () => api.get('/api/system/health');
export const getPipelineStatus = () => api.get('/api/pipeline/status');
export const getSystemMetrics = () => api.get('/api/system/metrics');
export const getKafkaStatus = () => api.get('/api/kafka/status');
export const getGeneratorStatus = () => api.get('/api/generator/status');
export const startGenerator = () => api.post('/api/generator/start');
export const stopGenerator = () => api.post('/api/generator/stop');
export const setGeneratorRate = (rate) => api.post('/api/generator/rate', { rate });
export const triggerScenario = (scenario) => api.post('/api/generator/scenario', { scenario });

// Rules
export const getRules = () => api.get('/api/rules');
export const createRule = (data) => api.post('/api/rules', data);
export const updateRule = (id, data) => api.put(`/api/rules/${id}`, data);
export const deleteRule = (id) => api.delete(`/api/rules/${id}`);

// Audit
export const getAuditLogs = (params) => api.get('/api/audit', { params });

// Reports
export const getSecurityReport = (period) => api.get('/api/reports/security', { params: { period } });
export const exportReportPdf = (params) => api.get('/api/reports/export/pdf', { params, responseType: 'blob' });
export const exportReportCsv = (params) => api.get('/api/reports/export/csv', { params, responseType: 'blob' });

// Auth — FastAPI uses OAuth2PasswordRequestForm (form data, not JSON)
export const login = (credentials) => {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  return api.post('/api/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};
export const getCurrentUser = () => api.get('/api/auth/me');
