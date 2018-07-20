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
  MenuItem,
  Popover,
  Card,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import PersonIcon from '@material-ui/icons/Person';
import QueryView from './views/QueryView/QueryView';
import AdvancedQueryView from './views/AdvancedQueryView/AdvancedQueryView';
import DataView from './views/DataView/DataView';
import ErrorView from './views/ErrorView/ErrorView';
import EditNodeView from './views/EditNodeView/EditNodeView';
import AddNodeView from './views/AddNodeView/AddNodeView';
import LoginView from './views/LoginView/LoginView';
import NodeDetailView from './views/NodeDetailView/NodeDetailView';
import auth from './services/auth';

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      loggedIn: !!auth.getToken(),
    };

    this.handleAuthenticate = this.handleAuthenticate.bind(this);
    this.handleRedirect = this.handleRedirect.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleLogOut = this.handleLogOut.bind(this);
  }

  /**
   * Refreshes state upon login page render.
   */
  handleRedirect() {
    this.setState({ loggedIn: !!auth.getToken() && !auth.isExpired() });
  }

  /**
   * Sets logged in status to true.
   */
  handleAuthenticate() {
    this.setState({ loggedIn: true });
  }

  /**
   * Opens user dropdown menu.
   * @param {Event} e - User menu button click event.
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
    this.setState({ loggedIn: false }, this.handleClose);
  }

  render() {
    const { anchorEl, loggedIn } = this.state;

    const theme = createMuiTheme({
      direction: 'ltr',
      palette: {
        primary: {
          main: '#26328C',
        },
        secondary: {
          light: '#CCCFE2',
          main: '#9AA1CB',
        },
        warn: {
          main: '#d32f2f',
        },
      },
    });

    const loginWithProps = () => (
      <LoginView
        handleRedirect={this.handleRedirect}
        handleAuthenticate={this.handleAuthenticate}
      />
    );

    const loggedInContent = (
      <Switch>
        <Route exact path="/query" component={QueryView} />
        <Route path="/query/advanced" component={AdvancedQueryView} />
        <Route path="/add" component={AddNodeView} />
        <Route path="/edit/:rid" component={EditNodeView} />
        <Route path="/ontology/:rid" component={NodeDetailView} />
        <Route path="/data" component={DataView} />
        <Redirect from="*" to="/query" />
      </Switch>
    );
    return (
      <MuiThemeProvider theme={theme}>
        <BrowserRouter>
          <div className="App">
            <AppBar position="static" className="banner">
              <Link className="icon-link" to="/query">
                <IconButton
                  color="inherit"
                  disabled={!loggedIn}
                >
                  <SearchIcon />
                </IconButton>
              </Link>
              <Link className="icon-link" to="/add">
                <IconButton
                  color="inherit"
                  disabled={!loggedIn}
                >
                  <AddIcon />
                </IconButton>
              </Link>

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
                      {loggedIn ? auth.getUser() : 'Logged Out'}
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
            <section className="content">
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
        </BrowserRouter>
      </MuiThemeProvider>
    );
  }
}

export default App;
