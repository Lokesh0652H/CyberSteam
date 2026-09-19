import React, { useState, useEffect } from 'react';
import SeverityBadge from '../components/Common/SeverityBadge';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import * as api from '../api/endpoints';
import { formatDate } from '../utils/formatters';
import { Download, Search, RefreshCw, Filter, Layers } from 'lucide-react';

const EventExplorerPage = () => {
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  
  const [filters, setFilters] = useState({
    event_type: '',
    severity: '',
    source_ip: '',
    username: '',
    server_id: ''
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: 25,
        event_type: filters.event_type || undefined,
        severity: filters.severity || undefined,
        source_ip: filters.source_ip || undefined,
        username: filters.username || undefined,
        server_id: filters.server_id || undefined
      };
      const res = await api.getEvents(params);
      const data = res.data;
      setEvents(data?.items || []);
      setTotalPages(data?.total_pages || 1);
      setTotalCount(data?.total || 0);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, filters.event_type, filters.severity]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await api.exportEventsCsv(filters);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cyberstream_events_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers color="var(--accent-secondary)" size={24} /> Distributed Event Explorer
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Query and filter raw cybersecurity streaming events from PostgreSQL/HDFS storage
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchEvents}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <form onSubmit={handleApplyFilter} className="card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1', minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Event Type</label>
          <select
            value={filters.event_type}
            onChange={e => setFilters({ ...filters, event_type: e.target.value })}
            className="input"
            style={{ width: '100%' }}
          >
            <option value="">All Event Types</option>
            <option value="HTTP_REQUEST">HTTP_REQUEST</option>
            <option value="API_REQUEST">API_REQUEST</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
            <option value="FIREWALL_ALLOW">FIREWALL_ALLOW</option>
            <option value="FIREWALL_BLOCK">FIREWALL_BLOCK</option>
            <option value="DNS_REQUEST">DNS_REQUEST</option>
            <option value="DNS_BLOCK">DNS_BLOCK</option>
            <option value="DATABASE_ACCESS">DATABASE_ACCESS</option>
            <option value="SERVER_ERROR">SERVER_ERROR</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Severity</label>
          <select
            value={filters.severity}
            onChange={e => setFilters({ ...filters, severity: e.target.value })}
            className="input"
            style={{ width: '100%' }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Source IP</label>
          <input
            type="text"
            placeholder="e.g. 10.0.1.5"
            value={filters.source_ip}
            onChange={e => setFilters({ ...filters, source_ip: e.target.value })}
            className="input"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Username</label>
          <input
            type="text"
            placeholder="e.g. admin, root"
            value={filters.username}
            onChange={e => setFilters({ ...filters, username: e.target.value })}
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
              setFilters({ event_type: '', severity: '', source_ip: '', username: '', server_id: '' });
              setPage(1);
            }}
            className="btn btn-ghost"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Events Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Total Results: <strong style={{ color: 'var(--text-primary)' }}>{totalCount.toLocaleString()}</strong> events</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px' }}><LoadingSpinner message="Querying event records..." /></div>
        ) : error ? (
          <div style={{ padding: '30px' }}><ErrorState message={error} onRetry={fetchEvents} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Time</th>
                  <th style={{ padding: '10px 14px' }}>Event Type</th>
                  <th style={{ padding: '10px 14px' }}>Severity</th>
                  <th style={{ padding: '10px 14px' }}>Source IP</th>
                  <th style={{ padding: '10px 14px' }}>Dest IP</th>
                  <th style={{ padding: '10px 14px' }}>User</th>
                  <th style={{ padding: '10px 14px' }}>Server</th>
                  <th style={{ padding: '10px 14px' }}>Status Code</th>
                  <th style={{ padding: '10px 14px' }}>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map((evt, idx) => (
                    <tr key={evt.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {formatDate(evt.timestamp)}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                        {evt.event_type}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <SeverityBadge severity={evt.severity} />
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                        {evt.source_ip}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {evt.destination_ip || '-'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>
                        {evt.username || '-'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {evt.server_id || '-'}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{
                          color: evt.status_code >= 500 ? 'var(--severity-critical)' :
                                 evt.status_code >= 400 ? 'var(--severity-high)' :
                                 evt.status_code >= 200 ? 'var(--severity-low)' : 'var(--text-muted)'
                        }}>
                          {evt.status_code || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {evt.response_time_ms ? `${evt.response_time_ms}ms` : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No events found matching the query criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Showing {events.length} rows</span>
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

export default EventExplorerPage;
