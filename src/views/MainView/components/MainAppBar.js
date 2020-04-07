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

import MenuLink from './MenuLink';

const MainAppBar = ({
  authorizationToken, authenticationToken, onDrawerChange, drawerOpen, activeLink, onLinkChange,
}) => {
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState(null);

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
              <MenuLink
                activeLink={activeLink}
                label="Feedback"
                onClick={handleClickLink}
                route="/feedback"
              />
              {isAdmin({ authorizationToken }) && (
                <MenuLink
                  activeLink={activeLink}
                  label="Admin"
                  onClick={handleClickLink}
                  route="/admin"
                />
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
  activeLink: PropTypes.string.isRequired,
  onDrawerChange: PropTypes.func.isRequired,
  onLinkChange: PropTypes.func.isRequired,
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
