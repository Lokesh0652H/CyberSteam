import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import * as api from '../api/endpoints';
import { formatDate } from '../utils/formatters';
import { FileText, Search, RefreshCw, UserCheck, Shield } from 'lucide-react';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ username: '', action: '' });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        page,
        page_size: 25,
        username: filters.username || undefined,
        action: filters.action || undefined
      });
      const data = res.data;
      setLogs(data?.items || []);
      setTotalPages(data?.total_pages || 1);
      setTotalCount(data?.total || 0);
      setError(null);
    } catch (err) {
      setError('Failed to fetch system audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Safe formatting for details to avoid "Objects are not valid as React child"
  const renderDetails = (details) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    if (typeof details === 'object') {
      try {
        return JSON.stringify(details);
      } catch {
        return '[Object Details]';
      }
    }
    return String(details);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText color="var(--accent-secondary)" size={24} /> System & Operator Audit Logs
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Tamper-evident audit trail of user logins, rule updates, generator toggles, and incident resolutions
          </p>
        </div>
        <button onClick={fetchLogs} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleApplyFilter} className="card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '180px' }}>
          <input
            type="text"
            placeholder="Filter by Username..."
            value={filters.username}
            onChange={e => setFilters({ ...filters, username: e.target.value })}
            className="input"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ flex: '1', minWidth: '180px' }}>
          <input
            type="text"
            placeholder="Filter by Action (e.g. LOGIN, UPDATE_RULE)..."
            value={filters.action}
            onChange={e => setFilters({ ...filters, action: e.target.value })}
            className="input"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} /> Filter
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters({ username: '', action: '' });
              setPage(1);
            }}
            className="btn btn-ghost"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Total Audit Records: <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong></span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px' }}><LoadingSpinner message="Querying audit logs..." /></div>
        ) : error ? (
          <div style={{ padding: '30px' }}><ErrorState message={error} onRetry={fetchLogs} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px' }}>Operator</th>
                  <th style={{ padding: '10px 16px' }}>Action</th>
                  <th style={{ padding: '10px 16px' }}>Target Resource</th>
                  <th style={{ padding: '10px 16px' }}>IP Address</th>
                  <th style={{ padding: '10px 16px' }}>Payload Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.username || 'System'}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                          background: log.action?.includes('DELETE') ? 'rgba(255,51,102,0.15)' :
                                     log.action?.includes('CREATE') ? 'rgba(0,255,136,0.15)' :
                                     'rgba(0,212,255,0.15)',
                          color: log.action?.includes('DELETE') ? 'var(--severity-critical)' :
                                 log.action?.includes('CREATE') ? 'var(--accent)' :
                                 'var(--accent-secondary)'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                        {log.resource} {log.resource_id ? `(#${log.resource_id})` : ''}
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {renderDetails(log.details)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No audit logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Showing {logs.length} audit events</span>
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
    </div>
  );
};

export default AuditLogPage;
