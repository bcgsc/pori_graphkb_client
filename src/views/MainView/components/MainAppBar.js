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

import {
  getUsername, isAdmin, isAuthenticated,
  logout,
} from '@/services/auth';


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
              {isAuthenticated({ authorizationToken, authenticationToken })
                ? getUsername({ authenticationToken, authorizationToken })
                : 'Logged Out'
                  }
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
  onDrawerChange: PropTypes.func.isRequired,
  authenticationToken: PropTypes.string,
  authorizationToken: PropTypes.string,
  drawerOpen: PropTypes.bool,

};

MainAppBar.defaultProps = {
  authenticationToken: '',
  authorizationToken: '',
  drawerOpen: false,
};

export default MainAppBar;
