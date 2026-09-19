import React from 'react';

const FilterPanel = ({ filters, values, onChange, onClear }) => {
  const handleChange = (key, val) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '16px', 
      padding: '16px', 
      background: 'var(--bg-card)', 
      border: '1px solid var(--border-primary)', 
      borderRadius: '12px',
      alignItems: 'flex-end'
    }}>
      {filters.map((filter) => (
        <div key={filter.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {filter.label}
          </label>
          
          {filter.type === 'select' ? (
            <select
              value={values[filter.key] || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              style={inputStyle}
            >
              <option value="">All</option>
              {filter.options?.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>
                  {opt.label || opt}
                </option>
              ))}
            </select>
          ) : filter.type === 'date' ? (
            <input
              type="date"
              value={values[filter.key] || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              style={inputStyle}
            />
          ) : (
            <input
              type="text"
              value={values[filter.key] || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              style={inputStyle}
              placeholder={`Filter ${filter.label}...`}
            />
          )}
        </div>
      ))}
      
      {onClear && (
        <button 
          onClick={onClear}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-secondary)',
            borderRadius: '8px',
            cursor: 'pointer',
            height: 'fit-content'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

const inputStyle = {
  padding: '10px 12px',
  background: 'var(--bg-input, #0f1219)',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
};

export default FilterPanel;
