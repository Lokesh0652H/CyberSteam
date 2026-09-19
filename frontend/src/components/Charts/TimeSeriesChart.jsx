import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TimeSeriesChart = ({ data, lines, xAxisKey = 'time', height = 300, showGrid = true, showTooltip = true, showLegend = true, type = 'line' }) => {
  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;

  return (
    <div style={{ width: '100%', height: height, background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', padding: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />}
          <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          {showTooltip && (
            <Tooltip 
              contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--border-primary)', borderRadius: '8px', backdropFilter: 'blur(12px)' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
          )}
          {showLegend && <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />}
          
          {lines.map((line, i) => (
            <DataComponent 
              key={i}
              type="monotone" 
              dataKey={line.dataKey} 
              name={line.name} 
              stroke={line.color} 
              fill={type === 'area' ? line.color : 'none'}
              fillOpacity={type === 'area' ? 0.3 : 1}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: line.color, stroke: 'none' }}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeSeriesChart;
