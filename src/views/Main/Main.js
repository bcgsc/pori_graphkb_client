/**
 * @module /Main
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Route,
  Redirect,
  Switch,
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
import fetchIntercept from 'fetch-intercept';

import config from '../../static/config';

import './Main.scss';
import {
  AboutView,
  AdminView,
  AdvancedSearchView,
  DataView,
  ErrorView,
  FeedbackView,
  LoginView,
  QueryView,
  PopularSearchView,
} from '..';

import {
  getUsername, isAdmin, logout, isAuthenticated,
} from '../../services/auth';
import { KBContext } from '../../components/KBContext';
import { MainNav } from './components';
import AuthenticatedRoute from '../../components/AuthenticatedRoute';

import RecordView from '../RecordView';
import NewRecordView from '../NewRecordView';

const {
  API_BASE_URL,
} = config;


/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
const Main = () => {
  const [authorizationToken, setAuthorizationToken] = useState('');
  const [authenticationToken, setAuthenticationToken] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/query');

  const dropdown = useRef();

  useEffect(() => {
    const unregister = fetchIntercept.register({
      request: (fetchUrl, fetchConfig) => {
        if (fetchUrl.startsWith(API_BASE_URL)) {
          const newConfig = { ...fetchConfig };

          if (!newConfig.headers) {
            newConfig.headers = {};
          }
          newConfig.headers.Authorization = authorizationToken;
          return [fetchUrl, newConfig];
        }
        return [fetchUrl, fetchConfig];
      },
    });
    return unregister;
  }, [authorizationToken]);

  const handleOpen = () => setAnchorEl(dropdown.current);
  const handleClose = () => setAnchorEl(null);

  const handleNavBar = ({ isOpen, activeLink: nextActiveLink }) => {
    setDrawerOpen(isOpen);
    setAnchorEl(null);
    setActiveLink(nextActiveLink);
  };

  const handleOpenNavBar = () => setDrawerOpen(true);
  const handleCloseNavBar = () => setDrawerOpen(false);

  return (
    <KBContext.Provider value={{
      authorizationToken, authenticationToken, setAuthorizationToken, setAuthenticationToken,
    }}
    >
      <div className="main-view">
        <AppBar
          position="fixed"
          className={`appbar ${drawerOpen ? 'appbar--drawer-open' : ''}`}
        >
          <IconButton
            color="inherit"
            onClick={handleOpenNavBar}
            className={`appbar__btn ${drawerOpen ? 'appbar__btn--drawer-open' : ''}`}
          >
            <MenuIcon />
          </IconButton>
          <div className={`appbar__title ${drawerOpen ? 'appbar__title--drawer-open' : ''}`}>
            <Link to="/query" onClick={handleCloseNavBar}>
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
                open={!!anchorEl}
                anchorEl={anchorEl}
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
        <MainNav isOpen={drawerOpen} onChange={handleNavBar} activeLink={activeLink} />
        <section className={`main-view__content ${drawerOpen ? 'main-view__content--drawer-open' : ''}`}>
          <Switch>
            <AuthenticatedRoute path="/feedback" component={FeedbackView} />
            <Route path="/login" component={LoginView} />
            <Route exact path="/error" component={ErrorView} />
            <Route path="/about" component={AboutView} />
            <AuthenticatedRoute exact path="/query" component={QueryView} />
            <AuthenticatedRoute path="/query-popular" component={PopularSearchView} />
            <AuthenticatedRoute exact path="/query-advanced" component={AdvancedSearchView} />
            <AuthenticatedRoute
              path="/:variant(edit)/:modelName(Source|source|User|user|UserGroup|usergroup)/:rid"
              admin
              component={RecordView}
            />
            <AuthenticatedRoute path="/:variant(edit|view)/:modelName/:rid" component={RecordView} />
            <AuthenticatedRoute path="/:variant(edit|view)/:rid" component={RecordView} />
            <AuthenticatedRoute
              path="/:variant(new)/:modelName(Source|source|User|user|UserGroup|usergroup)"
              admin
              component={NewRecordView}
            />
            <AuthenticatedRoute path="/:variant(new)/:modelName" component={NewRecordView} />
            <Redirect exact path="/query/advanced" to="/search/v" />
            <AuthenticatedRoute path="/data" component={DataView} />
            <AuthenticatedRoute path="/admin" admin component={AdminView} />
            <Redirect from="/" to="/query" />
          </Switch>
        </section>
      </div>
    </KBContext.Provider>
  );
};

export default Main;
