import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EventTimeline = ({ data, loading }) => {
  const chartData = Array.isArray(data) ? data : (data?.points && Array.isArray(data.points) ? data.points : []);

  if (loading || !chartData || chartData.length === 0) {
    return (
      <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {loading ? 'Loading Event Timeline...' : 'No timeline data collected yet'}
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '300px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Event Timeline</h3>
      <div style={{ width: '100%', height: 'calc(100% - 32px)' }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)', borderRadius: '8px', backdropFilter: 'blur(12px)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Area type="monotone" dataKey="events" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEvents)" />
            <Area type="monotone" dataKey="failures" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailures)" />
            <Area type="monotone" dataKey="blocked" stroke="#f97316" fillOpacity={1} fill="url(#colorBlocked)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EventTimeline;
