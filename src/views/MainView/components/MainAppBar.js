/**
 * @module /Main
 */
import '../index.scss';

import {
  AppBar,
  Button,
  Card,
  IconButton,
  MenuItem,
  Popover,
  Typography,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import PersonIcon from '@material-ui/icons/Person';
import PropTypes from 'prop-types';
import React, {
  useRef,
  useState,
} from 'react';
import {
  Link,
} from 'react-router-dom';

import { useAuth } from '@/components/Auth';

import MenuLink from './MenuLink';

function MainAppBar({
  onDrawerChange, drawerOpen, onLinkChange,
}) {
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState(null);
  const auth = useAuth();

  const dropdown = useRef();

  const handleOpen = () => setDropdownAnchorEl(dropdown.current);
  const handleClose = () => setDropdownAnchorEl(null);

  const handleDrawerChange = ({ isOpen }) => {
    onDrawerChange(isOpen);
    setDropdownAnchorEl(null);
  };

  const handleClickLink = (link) => {
    handleClose();
    onLinkChange({ isOpen: drawerOpen, activeLink: link });
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
              {auth.isAuthenticated
                ? auth.username
                : 'Logged Out'}
            </Typography>
          </Button>
          <Popover
            anchorEl={dropdownAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            onClose={handleClose}
            open={Boolean(dropdownAnchorEl)}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Card className="user-dropdown__content">
              <MenuLink
                label="Feedback"
                onClick={handleClickLink}
                route="/feedback"
              />
              {auth.isAdmin && (
                <MenuLink
                  label="Admin"
                  onClick={handleClickLink}
                  route="/admin"
                />
              )}
              {auth.isAuthenticated && (
                <MenuLink
                  label="Profile"
                  onClick={handleClickLink}
                  route="/user-profile"
                />
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
            </Card>
          </Popover>
        </div>
      </div>
    </AppBar>
  );
}

MainAppBar.propTypes = {
  onDrawerChange: PropTypes.func.isRequired,
  onLinkChange: PropTypes.func.isRequired,
  drawerOpen: PropTypes.bool,
};

MainAppBar.defaultProps = {
  drawerOpen: false,
};

export default MainAppBar;
