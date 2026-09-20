import React from 'react';
import { AppBar, Toolbar, IconButton, Badge, Typography, ToggleButtonGroup, ToggleButton, Menu, MenuItem, Box, Avatar } from '@mui/material';
import { Menu as MenuIcon, DarkMode, LightMode } from '@mui/icons-material';
import { Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ConnectionStatus from '../Common/ConnectionStatus';

const Header = ({ toggleSidebar, title = 'Dashboard', isMobile }) => {
  const { logout, user } = useAuth() || { logout: () => {} };
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isLive, setIsLive] = React.useState('live');
  const [themeMode, setThemeMode] = React.useState('dark');

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleThemeToggle = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
    alert('Theme is synced with your OS settings (prefers-color-scheme). Consider toggling OS theme.');
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'background.paper', backgroundImage: 'none', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider', zIndex: (theme) => theme.zIndex.drawer - 1 }}>
      <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
        {isMobile && (
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleSidebar} sx={{ mr: 2, color: 'text.primary', display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 500, color: 'text.primary', fontSize: '18px' }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 3 } }}>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <ToggleButtonGroup
              value={isLive}
              exclusive
              onChange={(e, val) => val && setIsLive(val)}
              size="small"
              sx={{ 
                bgcolor: 'action.hover', p: 0.5, borderRadius: 5, 
                '& .MuiToggleButton-root': { border: 'none', borderRadius: 4, px: 2, py: 0.5, textTransform: 'none', fontSize: 12, fontWeight: 500 }, 
                '& .Mui-selected': { bgcolor: 'info.main', color: '#fff', '&:hover': { bgcolor: 'info.dark' } } 
              }}
            >
              <ToggleButton value="live">Live</ToggleButton>
              <ToggleButton value="historical">Historical</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, borderRight: '1px solid', borderColor: 'divider', pr: 3 }}>
            <ConnectionStatus status="CONNECTED" />
          </Box>

          <IconButton onClick={handleThemeToggle} sx={{ color: 'text.secondary' }}>
            {themeMode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>

          <IconButton sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}>
              <Bell size={20} />
            </Badge>
          </IconButton>

          <Box>
            <IconButton onClick={handleMenu} sx={{ p: 0.5, display: 'flex', gap: 1, borderRadius: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main', fontSize: 14, fontWeight: 600 }}>
                {user?.username?.charAt(0)?.toUpperCase() || 'A'}
              </Avatar>
              <ChevronDown size={16} color="currentColor" style={{ opacity: 0.7 }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ sx: { mt: 1, minWidth: 150, boxShadow: 'var(--glass-shadow)', border: '1px solid var(--border-primary)', bgcolor: 'background.paper' } }}
            >
              <MenuItem onClick={() => { handleClose(); logout(); }} sx={{ color: 'error.main', fontSize: 14, py: 1.5 }}>
                <LogOut size={16} style={{ marginRight: 8 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
