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
import FeedbackView from './views/FeedbackView/FeedbackView';
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
    const { anchorEl, loggedIn } = this.state;

    const loginWithProps = () => (
      <LoginView
        history={history}
        handleLogOut={this.handleLogOut}
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
        <Router history={history}>
          <div className="App">
            <AppBar position="static" className="banner">
              <IconButton
                color="inherit"
                disabled={!loggedIn}
                onClick={() => history.push('/query')}
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                color="inherit"
                disabled={!loggedIn}
                onClick={() => history.push('/add')}
              >
                <AddIcon />
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
                      <MenuItem onClick={() => history.push('/feedback')}>
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
                  <Route path="/feedback" component={FeedbackView} />
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
