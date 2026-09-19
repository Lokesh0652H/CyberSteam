import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorState from '../components/Common/ErrorState';
import SeverityBadge from '../components/Common/SeverityBadge';
import * as api from '../api/endpoints';
import { Globe, MapPin, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';

const GeoAnalyticsPage = () => {
  const [geoData, setGeoData] = useState({ events_by_country: [], geo_points: [], high_risk_countries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGeoData = async () => {
    try {
      setLoading(true);
      const res = await api.getGeoAnalytics();
      setGeoData(res.data || { events_by_country: [], geo_points: [], high_risk_countries: [] });
      setError(null);
    } catch (err) {
      setError('Failed to fetch geographic threat intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeoData();
    const interval = setInterval(fetchGeoData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && geoData.geo_points.length === 0) return <LoadingSpinner message="Loading Geographic Threat Map..." />;
  if (error && geoData.geo_points.length === 0) return <ErrorState message={error} onRetry={fetchGeoData} />;

  const points = geoData.geo_points || [];
  const countries = geoData.events_by_country || [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe color="var(--accent-secondary)" size={24} /> Global Threat & Geographic Analytics
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time IP origin analysis and distributed attack vector visualization
          </p>
        </div>
        <button onClick={fetchGeoData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Map
        </button>
      </div>

      {/* High Risk Countries Chips */}
      {geoData.high_risk_countries && geoData.high_risk_countries.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px', background: 'rgba(255, 51, 102, 0.08)',
          borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 51, 102, 0.2)'
        }}>
          <ShieldAlert size={18} color="var(--severity-critical)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>High Traffic Attack Sources:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {geoData.high_risk_countries.map((c, i) => (
              <span key={i} style={{
                padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(255, 51, 102, 0.2)', color: 'var(--severity-critical)',
                fontSize: '0.75rem', fontWeight: 600
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Layout: Map + Country Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--gap-lg)' }}>
        {/* Map Container */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: '620px', position: 'relative' }}>
          <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: '#0a0d14' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {points.map((loc, idx) => {
              const hasBlocked = (loc.blocked || 0) > 0;
              const color = hasBlocked ? 'var(--severity-critical)' : 'var(--accent)';
              const radius = Math.max(6, Math.min(22, Math.sqrt(loc.events || 1) * 3));

              return (
                <CircleMarker
                  key={idx}
                  center={[loc.lat, loc.lng]}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.6,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div style={{ color: '#06080d', fontSize: '0.82rem' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700 }}>{loc.city}, {loc.country}</h4>
                      <p style={{ margin: '2px 0' }}>Total Events: <strong>{loc.events || 0}</strong></p>
                      <p style={{ margin: '2px 0', color: '#ff3366' }}>Blocked Threats: <strong>{loc.blocked || 0}</strong></p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Countries Breakdown Sidebar */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '620px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--accent)" /> Top Origin Countries
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {countries.length > 0 ? (
              countries.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.country || 'Unknown'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.ip_count || 1} unique IPs</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{(c.event_count || 0).toLocaleString()}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>events</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No geographic data recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoAnalyticsPage;
