import { createTheme, alpha } from '@mui/material/styles';

// Neon accent palette
const neon = {
  cyan: '#00d4ff',
  green: '#00ff88',
  purple: '#a855f7',
  pink: '#f472b6',
  orange: '#fb923c',
  red: '#ef4444',
  yellow: '#facc15',
};

// Severity colours
const severity = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#facc15',
  low: '#22c55e',
  info: '#3b82f6',
};

/**
 * Build a CyberStream MUI theme.
 * @param {'dark'|'light'} mode
 */
export function buildTheme(mode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary:   { main: neon.cyan },
      secondary: { main: neon.green },
      error:     { main: severity.critical },
      warning:   { main: severity.high },
      info:      { main: severity.info },
      success:   { main: severity.low },
      background: {
        default: isDark ? '#06080d' : '#f0f2f5',
        paper:   isDark ? '#0c1018' : '#ffffff',
      },
      text: {
        primary:   isDark ? '#e8edf5' : '#1a1a2e',
        secondary: isDark ? '#8b95a8' : '#555770',
      },
      divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    },

    typography: {
      fontFamily: "'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif",
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      body2: { fontSize: '0.85rem' },
    },

    shape: { borderRadius: 12 },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#1a2030 #06080d' : '#c1c1c1 #f0f2f5',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: isDark ? '#06080d' : '#f0f2f5' },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#1a2030' : '#c1c1c1',
              borderRadius: 3,
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(isDark && {
              background: alpha('#0c1018', 0.75),
              backdropFilter: 'blur(12px)',
              border: `1px solid ${alpha(neon.green, 0.08)}`,
            }),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            ...(isDark && {
              background: alpha('#111620', 0.8),
              backdropFilter: 'blur(16px)',
              border: `1px solid ${alpha(neon.green, 0.06)}`,
              boxShadow: `0 8px 32px ${alpha('#000', 0.4)}`,
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                borderColor: alpha(neon.cyan, 0.18),
                boxShadow: `0 0 24px ${alpha(neon.cyan, 0.06)}`,
              },
            }),
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
          },
          containedPrimary: isDark
            ? {
                background: `linear-gradient(135deg, ${neon.cyan}, ${alpha(neon.green, 0.8)})`,
                color: '#000',
                boxShadow: `0 0 20px ${alpha(neon.cyan, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 0 30px ${alpha(neon.cyan, 0.5)}`,
                },
              }
            : {},
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: isDark
            ? {
                background: '#0a0e15',
                borderRight: `1px solid ${alpha(neon.green, 0.06)}`,
              }
            : {},
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: isDark
            ? {
                background: alpha('#0c1018', 0.85),
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${alpha(neon.green, 0.06)}`,
                boxShadow: 'none',
              }
            : { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.75rem' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDark ? `1px solid ${alpha('#fff', 0.04)}` : undefined,
          },
        },
      },
    },
  });
}

export { neon, severity };
