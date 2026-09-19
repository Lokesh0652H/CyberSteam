import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const DataTable = ({ columns, data, onRowClick, loading, emptyMessage = 'No data available', sortable, sortColumn, sortDirection, onSort }) => {
  if (loading) {
    return (
      <div style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
                    <div style={{ height: '20px', background: 'var(--glass-bg)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th 
                key={i} 
                onClick={() => sortable && onSort && onSort(col.key)}
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid var(--border-primary)', 
                  color: 'var(--text-secondary)',
                  cursor: sortable ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {col.label}
                  {sortable && sortColumn === col.key && (
                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                style={{ 
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background var(--transition-normal)'
                }}
                onMouseOver={(e) => { if(onRowClick) e.currentTarget.style.background = 'var(--glass-bg)'; }}
                onMouseOut={(e) => { if(onRowClick) e.currentTarget.style.background = 'transparent'; }}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
