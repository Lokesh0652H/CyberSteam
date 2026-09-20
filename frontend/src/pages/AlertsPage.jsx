import React, { useState, useEffect } from 'react';
import SeverityBadge from '../components/Common/SeverityBadge';
import StatusBadge from '../components/Common/StatusBadge';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import * as api from '../api/endpoints';
import { formatDate } from '../utils/formatters';
import { useWebSocket } from '../hooks/useWebSocket';
import { ShieldAlert, CheckCircle2, Search, Filter, RefreshCw, AlertTriangle, Bot, Sparkles, X } from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Chip, Typography, Box, Alert } from '@mui/material';

const AlertsPage = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ severity: '', status: '', search: '' });
  const [liveBanner, setLiveBanner] = useState(null);

  // AI Summary Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleOpenAiSummary = async (alertItem) => {
    setSelectedAlert(alertItem);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiSummary('');
    setAiError('');
    try {
      const res = await api.getAlertSummary(alertItem.id);
      setAiSummary(res.data?.summary || 'No summary returned.');
    } catch (err) {
      setAiError(err.response?.data?.detail || err.message || 'Failed to generate AI incident briefing.');
    } finally {
      setAiLoading(false);
    }
  };

  // Connect to live alerts stream
  const { data: liveAlert, status: wsStatus } = useWebSocket('ws://localhost:8000/ws/alerts');

  useEffect(() => {
    if (liveAlert && liveAlert.alert_id) {
      setLiveBanner(liveAlert);
      // Auto-dismiss banner after 8s
      const timer = setTimeout(() => setLiveBanner(null), 8000);
      fetchData();
      return () => clearTimeout(timer);
    }
  }, [liveAlert]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, alertsRes] = await Promise.allSettled([
        api.getAlertStats(),
        api.getAlerts({
          page,
          severity: filters.severity || undefined,
          status: filters.status || undefined
        })
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (alertsRes.status === 'fulfilled') {
        const data = alertsRes.value.data;
        setAlerts(data?.items || []);
        setTotalPages(data?.total_pages || 1);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch alerts from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [page, filters.severity, filters.status]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateAlert(id, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return (
      a.alert_id?.toLowerCase().includes(s) ||
      a.rule_name?.toLowerCase().includes(s) ||
      a.source_ip?.toLowerCase().includes(s) ||
      a.server_id?.toLowerCase().includes(s)
    );
  });

  if (loading && !stats) return <LoadingSpinner message="Loading Security Alerts..." />;
  if (error && alerts.length === 0) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert color="var(--severity-critical)" size={24} /> Security Alerts & Incidents
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time threshold and rule-based incident detection stream
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Live Alert Toast Banner */}
      {liveBanner && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(255, 51, 102, 0.15)',
          border: '1px solid var(--severity-critical)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle color="var(--severity-critical)" size={20} />
            <span>
              <strong>NEW INCIDENT:</strong> [{liveBanner.alert_id}] {liveBanner.rule_name} triggered from{' '}
              <span className="mono">{liveBanner.source_ip}</span>
            </span>
          </div>
          <SeverityBadge severity={liveBanner.severity} />
        </div>
      )}

      {/* Stats KPI Row */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Alerts</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.total || 0}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '2px solid var(--severity-critical)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--severity-critical)' }}>Critical Alerts</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--severity-critical)' }}>{stats?.critical || 0}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '2px solid var(--severity-high)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--severity-high)' }}>High Severity</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--severity-high)' }}>{stats?.high || 0}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active (Open)</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)' }}>{stats?.open || 0}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resolved</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--severity-low)' }}>{stats?.resolved || 0}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search Alert ID, Rule, Source IP, Server..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input"
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          className="input"
          style={{ width: '160px' }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="input"
          style={{ width: '160px' }}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
          <option value="INVESTIGATING">INVESTIGATING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
        </select>

        {(filters.severity || filters.status || filters.search) && (
          <button
            onClick={() => setFilters({ severity: '', status: '', search: '' })}
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Alerts Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Severity</th>
                <th style={{ padding: '12px 16px' }}>Alert ID</th>
                <th style={{ padding: '12px 16px' }}>Rule Triggered</th>
                <th style={{ padding: '12px 16px' }}>Source IP</th>
                <th style={{ padding: '12px 16px' }}>Server</th>
                <th style={{ padding: '12px 16px' }}>Events</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Detected Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <SeverityBadge severity={item.severity} />
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {item.alert_id}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      <div>{item.rule_name}</div>
                      {item.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {item.source_ip || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {item.server_id || 'SRV-001'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {item.event_count || 1}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={item.status} />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {formatDate(item.timestamp || item.created_at)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenAiSummary(item)}
                          className="btn btn-sm btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(0, 212, 255, 0.1)',
                            borderColor: 'var(--accent-secondary, #00d4ff)',
                            color: 'var(--accent-secondary, #00d4ff)'
                          }}
                          title="Generate AI Incident Analysis with Google Gemini"
                        >
                          <Bot size={13} />
                          AI Brief
                        </button>
                        {item.status !== 'ACKNOWLEDGED' && item.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'ACKNOWLEDGED')}
                            className="btn btn-sm btn-secondary"
                          >
                            Ack
                          </button>
                        )}
                        {item.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleStatusChange(item.id, 'RESOLVED')}
                            className="btn btn-sm btn-primary"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No security alerts found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn btn-sm btn-secondary"
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="btn btn-sm btn-secondary"
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* AI Incident Analysis Dialog */}
      <Dialog
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0c1018',
            color: '#e8edf5',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.15)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', display: 'flex' }}>
              <Sparkles size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                AI Incident Briefing: {selectedAlert?.alert_id}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b95a8' }}>
                {selectedAlert?.rule_name} • Attacker IP: <span style={{ color: '#00ff88' }}>{selectedAlert?.source_ip}</span>
              </Typography>
            </Box>
          </Box>
          <Button onClick={() => setAiModalOpen(false)} sx={{ minWidth: 0, p: 1, color: '#8b95a8' }}>
            <X size={18} />
          </Button>
        </DialogTitle>

        <DialogContent sx={{ py: 3, px: 3 }}>
          {aiLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
              <CircularProgress sx={{ color: '#00d4ff' }} size={42} />
              <Typography variant="body2" sx={{ color: '#8b95a8', fontWeight: 500 }}>
                Querying Google Gemini 2.5 Flash for forensic correlation...
              </Typography>
            </Box>
          ) : aiError ? (
            <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {aiError}
            </Alert>
          ) : (
            <Box sx={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              fontSize: '0.9rem',
              color: '#d1d5db',
              bgcolor: 'rgba(0,0,0,0.3)',
              p: 2.5,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              {aiSummary}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button
            variant="outlined"
            onClick={() => setAiModalOpen(false)}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: '#e8edf5', textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AlertsPage;
