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
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import PersonIcon from '@material-ui/icons/Person';
import MenuIcon from '@material-ui/icons/Menu';
import QueryView from './views/QueryView/QueryView';
import AdvancedQueryView from './views/AdvancedQueryView/AdvancedQueryView';
import DataView from './views/DataView/DataView';
import ErrorView from './views/ErrorView/ErrorView';
import EditNodeView from './views/EditNodeView/EditNodeView';
import AddNodeView from './views/AddNodeView/AddNodeView';
import LoginView from './views/LoginView/LoginView';
import NodeDetailView from './views/NodeDetailView/NodeDetailView';
import UserView from './views/UserView/UserView';
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

  render() {
    const { anchorEl, loggedIn, drawerOpen } = this.state;

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
        open={drawerOpen}
        anchor="left"
        classes={{
          paper: 'drawer',
        }}
      >
        <List dense>
          <MenuItem onClick={() => history.push('/query')}>
            <ListItemAvatar>
              <IconButton color="inherit">
                <SearchIcon />
              </IconButton>
            </ListItemAvatar>
            <ListItemText primary="Query" />
          </MenuItem>
          <MenuItem onClick={() => history.push('/add')}>
            <ListItemAvatar>
              <IconButton color="inherit">
                <AddIcon />
              </IconButton>
            </ListItemAvatar>
            <ListItemText primary="Add Ontology" />
          </MenuItem>
        </List>
      </Drawer>
    );

    const loggedInContent = (
      <Switch>
        <Route exact path="/query" component={QueryView} />
        <Route path="/query/advanced" component={AdvancedQueryView} />
        <Route path="/add" component={AddNodeView} />
        <Route path="/edit/:rid" component={EditNodeView} />
        <Route path="/ontology/:rid" component={NodeDetailView} />
        <Route path="/data" component={DataView} />
        <Route path="/admin" component={UserView} />
        <Redirect from="*" to="/query" />
      </Switch>
    );
    return (
      <MuiThemeProvider theme={theme}>
        <Router history={history}>
          <div className="App">
            {drawer}
            <AppBar className={`banner ${drawerOpen ? 'drawer-shift' : ''}`}>
              <IconButton
                color="inherit"
                disabled={!loggedIn}
                onClick={() => this.setState({ drawerOpen: !drawerOpen })}
              >
                <MenuIcon />
              </IconButton>

              <div className="user-dropdown" ref={(node) => { this.dropdown = node; }}>
                <div>
                  <Button
                    classes={{ root: 'user-btn' }}
                    onClick={this.handleOpen}
                    size="small"
                    disabled={!loggedIn}
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
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <Card className="user-menu">
                      <MenuItem>
                        Settings
                      </MenuItem>
                      <MenuItem>
                        Feedback
                      </MenuItem>
                      <MenuItem onClick={this.handleLogOut}>
                        Logout
                      </MenuItem>
                    </Card>
                  </Popover>
                </div>
              </div>
            </AppBar>
            <section className={`content ${drawerOpen ? 'drawer-shift' : ''}`}>
              <div className="router-outlet">
                <Switch>
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
