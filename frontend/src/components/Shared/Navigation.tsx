import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ darkMode, toggleDarkMode }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Hamburger menu */}
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenu}
        >
          <MenuIcon />
        </IconButton>

        {/* App title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          WTLL Dashboard
        </Typography>

        {/* Dark mode toggle */}
        <IconButton color="inherit" onClick={toggleDarkMode}>
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        {/* Dropdown menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          keepMounted
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => handleNavigate('/')}>Home</MenuItem>
          <MenuItem onClick={() => handleNavigate('/players')}>Players Dashboard</MenuItem>
          <MenuItem onClick={() => handleNavigate('/evaluations')}>Evaluation Dashboard</MenuItem>
          <MenuItem onClick={() => handleNavigate('/address-validation')}>Address Dashboard</MenuItem>
          <MenuItem onClick={() => handleNavigate('/teams')}>Team Dashboard</MenuItem>
          <MenuItem onClick={() => handleNavigate('/draft-dashboard')}>Draft Dashboard</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;