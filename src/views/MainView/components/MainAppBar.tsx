import '../index.scss';

import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import {
  AppBar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import React, {
  useRef,
  useState,
} from 'react';
import {
  Link, NavLink,
} from 'react-router';

import { useAuth } from '@/components/Auth';

interface MainAppBarProps {
  onDrawerChange: (isOpen: boolean) => void;
  drawerOpen?: boolean;
}

const MainAppBar = ({
  onDrawerChange, drawerOpen = false,
}: MainAppBarProps) => {
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLDivElement | null>(null);
  const auth = useAuth();

  const dropdown = useRef<HTMLDivElement>(null);

  const handleOpen = () => setDropdownAnchorEl(dropdown.current);
  const handleClose = () => setDropdownAnchorEl(null);

  const handleDrawerChange = ({ isOpen }) => {
    onDrawerChange(isOpen);
    setDropdownAnchorEl(null);
  };

  return (
    <AppBar
      className={`appbar ${drawerOpen ? 'appbar--drawer-open' : ''}`}
      position="fixed"
    >
      <IconButton
        className={`appbar__btn ${drawerOpen ? 'appbar__btn--drawer-open' : ''}`}
        color="inherit"
        onClick={() => handleDrawerChange({ isOpen: true })}
      >
        <MenuIcon />
      </IconButton>
      <div className={`appbar__title ${drawerOpen ? 'appbar__title--drawer-open' : ''}`}>
        <Link onClick={() => handleDrawerChange({ isOpen: true })} to="/query">
          <Typography variant="h4">GraphKB</Typography>
          <Typography variant="caption">v{process.env.npm_package_version}</Typography>
        </Link>
      </div>
      <div className="user-dropdown" ref={dropdown}>
        <div>
          <Button
            classes={{ root: 'user-dropdown__icon' }}
            onClick={handleOpen}
            size="small"
          >
            <PersonIcon />
            <Typography color="inherit" variant="h6">
              {auth.isAuthenticated ? auth.username : 'Logged Out'}
            </Typography>
          </Button>
          <Menu
            anchorEl={dropdownAnchorEl}
            classes={{ paper: 'user-dropdown__content' }}
            id="user-menu"
            onClick={handleClose}
            onClose={handleClose}
            open={Boolean(dropdownAnchorEl)}
          >
            <MenuItem component={NavLink} to="/feedback">
              Feedback
            </MenuItem>
            {auth.isAdmin && (
              <MenuItem component={NavLink} to="/admin">
                Admin
              </MenuItem>
            )}
            {auth.isAuthenticated && (
              <MenuItem component={NavLink} to="/user-profile">
                Profile
              </MenuItem>
            )}
            {auth.isAuthenticated ? (
              <MenuItem onClick={() => auth.logout()}>
                Logout
              </MenuItem>
            ) : (
              <MenuItem onClick={() => auth.login()}>
                Login
              </MenuItem>
            )}
          </Menu>
        </div>
      </div>
    </AppBar>
  );
};

export default MainAppBar;
