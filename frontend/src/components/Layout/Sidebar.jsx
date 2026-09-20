import React from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Divider, Box, Typography, IconButton } from '@mui/material';
import { Menu as MenuIcon, SmartToy } from '@mui/icons-material';
import { 
  Shield, LayoutDashboard, Radio, ShieldAlert, Search, 
  Globe, Server, Map, GitBranch, Activity, BookOpen, 
  FileText, BarChart3, Settings, Menu, Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/target-app', icon: Zap, label: '🎯 Target Web App' },
  { path: '/events', icon: Radio, label: 'Live Events' },
  { path: '/alerts', icon: ShieldAlert, label: 'Alerts' },
  { path: '/explorer', icon: Search, label: 'Event Explorer' },
  { path: '/ips', icon: Globe, label: 'IP Analytics' },
  { path: '/servers', icon: Server, label: 'Server Analytics' },
  { path: '/geo', icon: Map, label: 'Geo Analytics' },
  { path: '/pipeline', icon: GitBranch, label: 'Pipeline Monitor' },
  { path: '/performance', icon: Activity, label: 'Performance' },
  { path: '/rules', icon: BookOpen, label: 'Rules' },
  { path: '/audit', icon: FileText, label: 'Audit Logs' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/assistant', icon: SmartToy, label: 'AI Assistant', isMuiIcon: true }
];

const drawerWidth = 260;

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const { user } = useAuth() || { user: { name: 'Admin', role: 'SOC Analyst' } };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ height: 64, display: 'flex', alignItems: 'center', px: 2.5, borderBottom: '1px solid', borderColor: 'divider', gap: 1.5 }}>
        <Shield size={24} color="#00aaff" />
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', letterSpacing: 0.5, flex: 1 }}>
          CyberStream
        </Typography>
        {isMobile && (
          <IconButton onClick={toggleSidebar} sx={{ color: 'text.primary' }}>
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      <List sx={{ flex: 1, overflowY: 'auto', py: 2, px: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <motion.div whileHover={{ scale: 1.02 }} style={{ width: '100%' }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={() => isMobile && toggleSidebar()}
                  sx={{
                    borderRadius: 1,
                    py: 1,
                    px: 2,
                    '&.active': {
                      bgcolor: 'rgba(0, 212, 255, 0.1)',
                      borderLeft: '3px solid #00d4ff',
                      '& .MuiListItemIcon-root': { color: '#00d4ff' },
                      '& .MuiListItemText-primary': { color: 'text.primary', fontWeight: 500 }
                    },
                    '&:not(.active)': {
                      borderLeft: '3px solid transparent',
                      color: 'text.secondary'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    {item.isMuiIcon ? <Icon fontSize="small" /> : <Icon size={18} />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontSize: 14 }}
                  />
                </ListItemButton>
              </motion.div>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'info.main', width: 36, height: 36, fontSize: 16, fontWeight: 600 }}>
          {user?.username?.charAt(0)?.toUpperCase() || 'A'}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {user?.username || 'Administrator'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {typeof user?.role === 'object' ? user.role.label : (user?.role || 'Analyst')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={isOpen}
          onClose={toggleSidebar}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
