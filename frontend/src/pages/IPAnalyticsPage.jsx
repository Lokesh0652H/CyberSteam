import React, { useState, useEffect } from 'react';
import DataTable from '../components/Common/DataTable';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import SeverityBadge from '../components/Common/SeverityBadge';
import * as api from '../api/endpoints';

const IPAnalyticsPage = () => {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIp, setSelectedIp] = useState(null);
  const [ipDetails, setIpDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchIPs = async () => {
      try {
        const data = await api.getIPs();
        setIps(data || []);
      } catch (err) {
        setError('Failed to fetch IP analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchIPs();
  }, []);

  const handleRowClick = async (row) => {
    setSelectedIp(row.ip);
    setDetailsLoading(true);
    try {
      const details = await api.getIPDetails(row.ip);
      setIpDetails(details);
    } catch (e) {
      console.error("Failed to load IP details", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const columns = [
    { key: 'ip', label: 'IP Address', render: (val) => <span className="mono">{val}</span> },
    { key: 'country', label: 'Country' },
    { key: 'total_events', label: 'Total Events' },
    { key: 'failed_events', label: 'Failed' },
    { key: 'blocked_events', label: 'Blocked' },
    { key: 'risk_level', label: 'Risk Level', render: (val) => <SeverityBadge level={val} /> }
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page-container ip-analytics-page two-col-layout">
      <div className="panel list-panel">
        <h3>Top Source IPs</h3>
        <DataTable 
          columns={columns} 
          data={ips} 
          onRowClick={handleRowClick}
          activeRowId={selectedIp}
          rowIdKey="ip"
        />
      </div>

      <div className="panel detail-panel">
        {detailsLoading ? <LoadingSpinner /> : selectedIp && ipDetails ? (
          <div className="ip-details">
            <h3>IP Details: <span className="mono">{selectedIp}</span></h3>
            <div className="stats-grid mini">
              <div className="stat-box">
                <span className="label">Total Events</span>
                <span className="value">{ipDetails.total_events}</span>
              </div>
              <div className="stat-box">
                <span className="label">Failed Logins</span>
                <span className="value">{ipDetails.failed_logins}</span>
              </div>
              <div className="stat-box">
                <span className="label">Blocked Requests</span>
                <span className="value">{ipDetails.blocked_requests}</span>
              </div>
            </div>
            {/* Charts would go here based on ipDetails.event_timeline, etc. */}
            <div className="charts-placeholder">
              <p className="text-muted">Event Type Breakdown & Timeline would render here.</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">Select an IP to view details</div>
        )}
      </div>
    </div>
  );
};

export default IPAnalyticsPage;
