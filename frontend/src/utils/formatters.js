export const formatNumber = (num) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

export const formatTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  }).format(date);
};

export const getSeverityColor = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'var(--severity-critical)';
    case 'HIGH': return 'var(--severity-high)';
    case 'MEDIUM': return 'var(--severity-medium)';
    case 'LOW': return 'var(--severity-low)';
    case 'INFO':
    default: return 'var(--severity-info)';
  }
};
