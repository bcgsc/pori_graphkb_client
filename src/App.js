import React, { Component } from 'react';
import {
  BrowserRouter,
  Link,
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
  Menu,
  MenuItem,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import QueryView from './views/QueryView/QueryView';
import AdvancedQueryView from './views/AdvancedQueryView/AdvancedQueryView';
import DataView from './views/DataView/DataView';
import ErrorView from './views/ErrorView/ErrorView';
import NodeFormComponent from './components/NodeFormComponent/NodeFormComponent';
import LoginView from './views/LoginView/LoginView';
import auth from './services/auth';

/**
 * Entry point to application. Handles routing set up as well as defining the app theme.
 */
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      loggedIn: !!auth.getToken(),
    };
    this.handleAuthenticate = this.handleAuthenticate.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleLogOut = this.handleLogOut.bind(this);
  }

  handleAuthenticate() {
    this.setState({ loggedIn: true });
  }

  handleOpen(e) {
    this.setState({ anchorEl: e.currentTarget });
  }

  handleClose() {
    this.setState({ anchorEl: null });
  }

  handleLogOut() {
    auth.clearToken();
    this.setState({ loggedIn: false }, this.handleClose);
  }

  render() {
    const { anchorEl, loggedIn } = this.state;

    const theme = createMuiTheme({
      direction: 'ltr',
      palette: {
        primary: {
          main: '#1F2B65',
        },
        secondary: {
          light: '#009688',
          main: '#00897b',
        },
        warn: {
          main: '#d32f2f',
        },
      },
    });

    const addNodeForm = () => <NodeFormComponent variant="add" />;
    const loginWithProps = () => (
      <LoginView loggedIn={loggedIn} handleAuthenticate={this.handleAuthenticate} />
    );

    const loggedInContent = (
      <Switch>
        <Route exact path="/">
          <Redirect to="/query" />
        </Route>
        <Route exact path="/query" component={QueryView} />
        <Route path="/query/advanced" component={AdvancedQueryView} />
        <Route path="/add" component={addNodeForm} />
        <Route path="/data" component={DataView} />
        <Route path="/error" component={ErrorView} />
        <Redirect from="*" to="/query" />
      </Switch>
    );

    return (
      <MuiThemeProvider theme={theme}>
        <BrowserRouter>
          <div className="App">
            <AppBar position="static" className="banner">
              <IconButton color="inherit" aria-label="open drawer">
                <Link className="icon-link" to="/query">
                  <SearchIcon />
                </Link>
              </IconButton>
              <IconButton color="inherit" aria-label="open drawer">
                <Link className="icon-link" to="/add">
                  <AddIcon />
                </Link>
              </IconButton>

              <div className="user-dropdown">
                <Button
                  classes={{ root: 'user-btn' }}
                  onClick={this.handleOpen}
                  size="small"
                  disabled={!loggedIn}
                >
                  <AccountCircleIcon />
                  <Typography variant="body2">
                    {loggedIn ? auth.getUser() : 'Logged Out'}
                  </Typography>
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={!!anchorEl}
                  onClose={this.handleClose}
                >
                  <MenuItem onClick={this.handleLogOut}>
                    Logout
                  </MenuItem>
                </Menu>
              </div>
            </AppBar>
            <section className="content">
              <div className="router-outlet">
                <Switch>
                  <Route path="/login" render={loginWithProps} />
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
        </BrowserRouter>
      </MuiThemeProvider>
    );
  }
}

export default App;
