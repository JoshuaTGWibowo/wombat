import { Box, List, ListItemButton, ListItemIcon, Tooltip } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import DescriptionIcon from '@mui/icons-material/Description';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink } from 'react-router-dom';

export default function LeftNavbar() {
  return (
    <Box sx={{ width: 64, bgcolor: '#171717', borderRight: '1px solid #374151', position: 'fixed', top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
      <List sx={{ p: 0 }}>
        <Tooltip title="Import">
          <ListItemButton component={RouterLink} to="/import" sx={{ justifyContent: 'center' }}>
            <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
              <HomeIcon sx={{ color: 'text.secondary' }} />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
        <Tooltip title="Layout">
          <ListItemButton component={RouterLink} to="/layout" sx={{ justifyContent: 'center' }}>
            <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
              <ViewModuleIcon sx={{ color: 'text.secondary' }} />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
        <Tooltip title="Script">
          <ListItemButton component={RouterLink} to="/script" sx={{ justifyContent: 'center' }}>
            <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
              <DescriptionIcon sx={{ color: 'text.secondary' }} />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
      </List>
    </Box>
  );
}


