import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange) onChange(localValue);
    }, 300);

    return () => clearTimeout(handler);
  }, [localValue, onChange]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <Search 
        size={18} 
        style={{ 
          position: 'absolute', 
          left: '12px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--text-secondary)' 
        }} 
      />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 16px 10px 40px',
          background: 'var(--bg-input, #0f1219)',
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
          transition: 'all var(--transition-normal)'
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--severity-info)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border-primary)'}
      />
    </div>
  );
};

export default SearchBar;
