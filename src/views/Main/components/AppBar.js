/**
 * @module /Main
 */
import React, {
  useState, useRef,
} from 'react';
import PropTypes from 'prop-types';
import {
  Link,
} from 'react-router-dom';
import {
  AppBar,
  IconButton,
  Button,
  Typography,
  MenuItem,
  Popover,
  Card,
} from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import MenuIcon from '@material-ui/icons/Menu';


import '../Main.scss';

import {
  getUsername, isAdmin, logout, isAuthenticated,
} from '../../../services/auth';


const MainAppBar = ({
  authorizationToken, authenticationToken, onDrawerChange, drawerOpen,
}) => {
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState(null);

  const dropdown = useRef();

  const handleOpen = () => setDropdownAnchorEl(dropdown.current);
  const handleClose = () => setDropdownAnchorEl(null);

  const handleDrawerChange = ({ isOpen }) => {
    onDrawerChange(isOpen);
    setDropdownAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      className={`appbar ${drawerOpen ? 'appbar--drawer-open' : ''}`}
    >
      <IconButton
        color="inherit"
        onClick={() => handleDrawerChange({ isOpen: true })}
        className={`appbar__btn ${drawerOpen ? 'appbar__btn--drawer-open' : ''}`}
      >
        <MenuIcon />
      </IconButton>
      <div className={`appbar__title ${drawerOpen ? 'appbar__title--drawer-open' : ''}`}>
        <Link to="/query" onClick={() => handleDrawerChange({ isOpen: true })}>
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
              {isAuthenticated({ authorizationToken, authenticationToken })
                ? getUsername({ authenticationToken, authorizationToken })
                : 'Logged Out'
                  }
            </Typography>
          </Button>
          <Popover
            open={Boolean(dropdownAnchorEl)}
            anchorEl={dropdownAnchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Card className="user-dropdown__content">
              <Link to="/feedback">
                <MenuItem onClick={handleClose}>
                      Feedback
                </MenuItem>
              </Link>
              {isAdmin({ authorizationToken }) && (
                <Link to="/admin">
                  <MenuItem onClick={handleClose}>
                        Admin
                  </MenuItem>
                </Link>
              )}
              <MenuItem onClick={() => logout()}>
                {
                isAuthenticated({ authorizationToken, authenticationToken })
                  ? 'Logout'
                  : 'Login'
              }
              </MenuItem>
            </Card>
          </Popover>
        </div>
      </div>
    </AppBar>
  );
};

MainAppBar.propTypes = {
  authenticationToken: PropTypes.string,
  authorizationToken: PropTypes.string,
  onDrawerChange: PropTypes.func.isRequired,
  drawerOpen: PropTypes.bool,

};

MainAppBar.defaultProps = {
  authenticationToken: '',
  authorizationToken: '',
  drawerOpen: false,
};

export default MainAppBar;
