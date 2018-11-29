/**
 * @module /App
 */
import React, { Component } from 'react';
import {
  Router,
  Route,
  Redirect,
  Switch,
  Link,
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
  ListItemIcon,
  Divider,
  Collapse,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import PersonIcon from '@material-ui/icons/Person';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { schema as SCHEMA_DEFN } from '@bcgsc/knowledgebase-schema';
import {
  AddOntologyView,
  AddStatementView,
  AdminView,
  AdvancedQueryView,
  DataView,
  EditOntologyView,
  EditStatementView,
  ErrorView,
  FeedbackView,
  IconsView,
  LoginView,
  QueryView,
  AddVariantView,
  EditVariantView,
  QueryBuilderView,
} from './views';
import logo from './static/logo.png';
import title from './static/title.png';
import auth from './services/auth';
import history from './services/history';
import Schema from './models/schema';
import { SchemaContext } from './components/SchemaContext/SchemaContext';

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
      primary: 'rgba(0, 0, 0, 0.7)',
      secondary: 'rgba(0, 0, 0, 0.54)',
    },
  },
  typography: {
    useNextVariants: true,
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
      expanded: [],
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleLogOut = this.handleLogOut.bind(this);
    this.handleDrawerExpand = this.handleDrawerExpand.bind(this);
    this.handleAuthenticate = this.handleAuthenticate.bind(this);
    this.handleSideBarNavigate = this.handleSideBarNavigate.bind(this);
    this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
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
    this.setState({ loggedIn: false, anchorEl: null });
  }

  /**
   * Disables action buttons in headers and force redirects to /login.
   * setState call required so component is re rendered.
   */
  handleAuthenticate() {
    this.setState({ loggedIn: true });
  }

  handleDrawerExpand(item) {
    return () => {
      const { expanded } = this.state;
      if (expanded === item) {
        this.setState({ expanded: '' });
      } else {
        this.setState({ expanded: item, drawerOpen: true });
      }
    };
  }

  /**
   * Opens the main navigation drawer.
   */
  handleDrawerOpen() {
    this.setState({ drawerOpen: true });
  }

  handleDrawerClose() {
    this.setState({ expanded: '', drawerOpen: false });
  }

  /**
   * Handle route navigation.
   * @param {string} route - path string.
   */
  handleSideBarNavigate(route) {
    history.push(route);
    this.handleDrawerClose();
  }

  render() {
    const {
      anchorEl,
      loggedIn,
      drawerOpen,
      expanded,
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
        <div className="banner drawer-logo">
          <IconButton
            disabled={!loggedIn}
            onClick={this.handleDrawerClose}
          >
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className="drawer-links">
          <Link to="/query">
            <MenuItem
              id="link-search"
              onClick={this.handleDrawerClose}
            >
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="Query" />
            </MenuItem>
          </Link>
          <MenuItem onClick={this.handleDrawerExpand('add')}>
            <ListItemIcon>
              <div style={{ display: 'inline-flex' }}>
                <AddIcon color={expanded === 'add' && drawerOpen ? 'secondary' : undefined} />
              </div>
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                color: expanded === 'add' && drawerOpen ? 'secondary' : undefined,
              }}
              primary="Add new record"
            />
          </MenuItem>
          <Collapse in={expanded === 'add' && drawerOpen}>
            <Link to="/add/ontology">
              <MenuItem
                id="link-add"
                onClick={this.handleDrawerClose}
              >
                <ListItemText inset primary="Ontology" />
              </MenuItem>
            </Link>
            <Link to="/add/variant">
              <MenuItem
                id="link-variant"
                onClick={this.handleDrawerClose}
              >
                <ListItemText inset primary="Variant" />
              </MenuItem>
            </Link>
            <Link to="/add/statement">
              <MenuItem
                id="link-statement"
                onClick={this.handleDrawerClose}
              >
                <ListItemText inset primary="Statement" />
              </MenuItem>
            </Link>
          </Collapse>
        </List>
        <div className="drawer-footer">
          <Divider />
          <ListItem dense>
            <ListItemIcon>
              <img id="bcc-logo" src={logo} alt="" />
            </ListItemIcon>
            <img id="bcc-label" src={title} alt="" />
          </ListItem>
        </div>
      </Drawer>
    );

    const loggedInContent = (
      <Switch>
        <Route exact path="/query" component={QueryView} />
        <Route exact path="/query/advanced" component={AdvancedQueryView} />
        <Route exact path="/query/advanced/builder" component={QueryBuilderView} />
        <Route path="/add/ontology" component={AddOntologyView} />
        <Route path="/add/variant" component={AddVariantView} />
        <Route path="/add/statement" component={AddStatementView} />
        <Route path="/edit/ontology/:rid" component={EditOntologyView} />
        <Route path="/edit/variant/:rid" component={EditVariantView} />
        <Route path="/edit/statement/:rid" component={EditStatementView} />
        <Route path="/data" component={DataView} />
        <Route path="/feedback" component={FeedbackView} />
        <Route path="/admin" component={AdminView} />
        <Redirect from="*" to="/query" />
      </Switch>
    );
    return (
      <SchemaContext.Provider value={new Schema(SCHEMA_DEFN)}>
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
                    onClick={this.handleDrawerOpen}
                    className="appbar-btn"
                  >
                    <MenuIcon />
                  </IconButton>
                )}
                <div className="appbar-title">
                  <Link to="/query" onClick={this.handleDrawerClose}>
                    <Typography variant="h6">GraphKB</Typography>
                  </Link>
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
                      <Typography color="inherit">
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
                    <Route path="/icons" component={IconsView} />
                    <Route path="/login" render={loginWithProps} />
                    <Route path="/error" component={ErrorView} />
                    {loggedIn ? <Route path="/" render={() => loggedInContent} /> : <Redirect push to="/login" />}
                  </Switch>
                </div>
              </section>
            </div>
          </Router>
        </MuiThemeProvider>
      </SchemaContext.Provider>
    );
  }
}

export default App;
