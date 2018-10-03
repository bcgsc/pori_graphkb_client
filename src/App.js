/**
 * @module /App
 */

import React, { Component } from 'react';
import {
  Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import './App.css';
import {
  AppBar,
  createMuiTheme,
  MuiThemeProvider,
  IconButton,
  Button,
  Typography,
  MenuItem,
  Popover,
  Card,
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import PersonIcon from '@material-ui/icons/Person';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import DNAIcon from './icons/DNAIcon/DNAIcon';
import QueryView from './views/QueryView/QueryView';
import AdvancedQueryView from './views/AdvancedQueryView/AdvancedQueryView';
import DataView from './views/DataView/DataView';
import ErrorView from './views/ErrorView/ErrorView';
import EditOntologyView from './views/EditOntologyView/EditOntologyView';
import AddOntologyView from './views/AddOntologyView/AddOntologyView';
import LoginView from './views/LoginView/LoginView';
import FeedbackView from './views/FeedbackView/FeedbackView';
import VariantFormView from './views/VariantFormView/VariantFormView';
import AdminView from './views/AdminView/AdminView';
import iconsview from './views/iconsview/iconsview';
import logo from './logo.png';
import auth from './services/auth';
import history from './services/history';

const theme = createMuiTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#26328C',
    },
    secondary: {
      main: '#54B198',
      light: '#CCCFE2',
    },
    error: {
      main: '#d32f2f',
    },
    text: {
      primary: 'rgba(0,0,0,0.7)',
      secondary: 'rgba(0,0,0,0.54)',
    },
  },
});

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      loggedIn: (!!auth.getToken() && !auth.isExpired()),
      drawerOpen: false,
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleLogOut = this.handleLogOut.bind(this);
    this.handleAuthenticate = this.handleAuthenticate.bind(this);
    this.handleSideBarNavigate = this.handleSideBarNavigate.bind(this);
  }

  /**
   * Opens user dropdown menu.
   */
  handleOpen() {
    this.setState({ anchorEl: this.dropdown });
  }

  /**
   * Closes user dropdown menu.
   */
  handleClose() {
    this.setState({ anchorEl: null });
  }

  /**
   * Clears authentication token and sets logged in status to false.
   */
  handleLogOut() {
    auth.clearToken();
    this.handleClose();
    this.setState({ loggedIn: false });
  }

  /**
   * Disables action buttons in headers and force redirects to /login.
   */
  handleAuthenticate() {
    this.setState({ loggedIn: true });
  }

  /**
   * Handle route navigation.
   * @param {string} route - path string.
   */
  handleSideBarNavigate(route) {
    history.push(route);
    this.setState({ drawerOpen: false });
  }

  render() {
    const {
      anchorEl,
      loggedIn,
      drawerOpen,
    } = this.state;

    const loginWithProps = () => (
      <LoginView
        history={history}
        handleLogOut={this.handleLogOut}
        handleAuthenticate={this.handleAuthenticate}
      />
    );

    const drawer = (
      <Drawer
        variant="persistent"
        open
        anchor="left"
        classes={{
          paper: `drawer${drawerOpen ? '' : ' drawer-closed'}`,
        }}
      >
        <div className="banner">
          <div className="drawer-logo">
            <IconButton
              disabled={!loggedIn}
              onClick={() => this.setState({ drawerOpen: false })}
            >
              <ChevronLeftIcon />
            </IconButton>
          </div>
        </div>
        <Divider />
        <List className="drawer-links">
          <MenuItem
            id="link-search"
            onClick={() => this.handleSideBarNavigate('/query')}
          >
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Query" />
          </MenuItem>
          <MenuItem
            id="link-add"
            onClick={() => this.handleSideBarNavigate('/add')}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Add Ontology" />
          </MenuItem>
          <MenuItem
            id="link-variant"
            onClick={() => this.handleSideBarNavigate('/variant')}
          >
            <ListItemIcon>
              <DNAIcon />
            </ListItemIcon>
            <ListItemText primary="Add Variant" />
          </MenuItem>
        </List>
        <div className="drawer-footer">
          <Divider />
          <MenuItem>
            <ListItemIcon>
              <img src={logo} alt="" />
            </ListItemIcon>
            <ListItemText primary="Knowledge Base" />
          </MenuItem>
        </div>
      </Drawer>
    );

    const loggedInContent = (
      <Switch>
        <Route exact path="/query" component={QueryView} />
        <Route path="/query/advanced" component={AdvancedQueryView} />
        <Route path="/add" component={AddOntologyView} />
        <Route path="/edit/:rid" component={EditOntologyView} />
        <Route path="/data" component={DataView} />
        <Route path="/feedback" component={FeedbackView} />
        <Route path="/variant" component={VariantFormView} />
        <Route path="/admin" component={AdminView} />
        <Redirect from="*" to="/query" />
      </Switch>
    );
    return (
      <MuiThemeProvider theme={theme}>
        <Router history={history}>
          <div className="App">
            <AppBar
              position="absolute"
              className={`banner ${drawerOpen ? 'drawer-shift' : ''}`}
            >
              {!drawerOpen && loggedIn && (
                <IconButton
                  color="inherit"
                  onClick={() => this.setState({ drawerOpen: true })}
                  className="appbar-btn"
                >
                  <MenuIcon />
                </IconButton>
              )}
              <div className="appbar-title">
                <Typography variant="title">Knowledge Base</Typography>
              </div>
              <div className="user-dropdown" ref={(node) => { this.dropdown = node; }}>
                <div>
                  <Button
                    classes={{ root: 'user-btn' }}
                    onClick={this.handleOpen}
                    size="small"
                    disabled={!loggedIn}
                    className="appbar-btn"
                  >
                    <PersonIcon />
                    <Typography variant="body2">
                      {auth.getUser() || 'Logged Out'}
                    </Typography>
                  </Button>
                  <Popover
                    open={!!anchorEl}
                    anchorEl={anchorEl}
                    onClose={this.handleClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                  >
                    <Card className="user-menu">
                      <MenuItem onClick={() => { history.push('/feedback'); this.handleClose(); }}>
                        Feedback
                      </MenuItem>
                      {auth.isAdmin() && (
                        <MenuItem onClick={() => { history.push('/admin'); this.handleClose(); }}>
                          Admin
                        </MenuItem>
                      )}
                      <MenuItem onClick={this.handleLogOut}>
                        Logout
                      </MenuItem>
                    </Card>
                  </Popover>
                </div>
              </div>
            </AppBar>
            {loggedIn && drawer}
            <section className={`content ${(drawerOpen ? loggedIn : '') && 'drawer-shift'} ${!loggedIn ? 'no-drawer' : ''}`}>
              <div className="router-outlet">
                <Switch>
                  <Route path="/icons" component={iconsview} />
                  <Route path="/login" render={loginWithProps} />
                  <Route path="/error" component={ErrorView} />
                  <Route
                    path="/"
                    render={() => {
                      if (!loggedIn) {
                        return <Redirect to="/login" />;
                      }
                      return loggedInContent;
                    }}
                  />
                </Switch>
              </div>
            </section>
          </div>
        </Router>
      </MuiThemeProvider>
    );
  }
}

export default App;
