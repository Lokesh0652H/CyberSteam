import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  const pages = [];
  
  // Simple pagination logic
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  if (currentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }
  if (currentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            width: '32px', height: '32px', borderRadius: '6px', 
            background: currentPage === 1 ? 'transparent' : 'var(--glass-bg)',
            border: '1px solid var(--border-primary)',
            color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft size={16} />
        </button>
        
        {startPage > 1 && (
          <>
            <button onClick={() => onPageChange(1)} style={pageBtnStyle(false)}>1</button>
            {startPage > 2 && <span style={{ color: 'var(--text-secondary)' }}>...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button 
            key={page} 
            onClick={() => onPageChange(page)}
            style={pageBtnStyle(page === currentPage)}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span style={{ color: 'var(--text-secondary)' }}>...</span>}
            <button onClick={() => onPageChange(totalPages)} style={pageBtnStyle(false)}>{totalPages}</button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            width: '32px', height: '32px', borderRadius: '6px', 
            background: currentPage === totalPages ? 'transparent' : 'var(--glass-bg)',
            border: '1px solid var(--border-primary)',
            color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const pageBtnStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '32px', height: '32px', borderRadius: '6px',
  background: isActive ? 'var(--severity-info)' : 'transparent',
  border: isActive ? 'none' : '1px solid var(--border-primary)',
  color: isActive ? '#fff' : 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'all var(--transition-normal)'
});

export default Pagination;
