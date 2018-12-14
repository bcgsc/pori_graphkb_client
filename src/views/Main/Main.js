/**
 * @module /Main
 */
import React, { Component } from 'react';
import {
  Route,
  Redirect,
  Switch,
  Link,
} from 'react-router-dom';
import './Main.css';
import {
  AppBar,
  IconButton,
  Button,
  Typography,
  MenuItem,
  Popover,
  Card,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PersonIcon from '@material-ui/icons/Person';
import MenuIcon from '@material-ui/icons/Menu';
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
  LoginView,
  QueryView,
  AddVariantView,
  EditVariantView,
  QueryBuilderView,
  TutorialView,
} from '..';
import auth from '../../services/auth';
import Schema from '../../services/schema';
import { KBContext } from '../../components/KBContext/KBContext';
import MainNav from '../../components/MainNav/MainNav';

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
class Main extends Component {
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
    this.handleNavBar = this.handleNavBar.bind(this);
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
    this.setState({ loggedIn: false, anchorEl: null, drawerOpen: false });
  }

  /**
   * Disables action buttons in headers and force redirects to /login.
   * setState call required so component is re rendered.
   */
  handleAuthenticate() {
    this.setState({ loggedIn: true });
  }

  /**
   * Sets main navigation drawer open state.
   */
  handleNavBar(state) {
    return () => this.setState({ drawerOpen: state });
  }

  render() {
    const {
      anchorEl,
      loggedIn,
      drawerOpen,
    } = this.state;

    const loginWithProps = () => (
      <LoginView
        handleLogOut={this.handleLogOut}
        handleAuthenticate={this.handleAuthenticate}
      />
    );


    const links = [
      {
        label: 'Query',
        route: '/query',
        icon: <SearchIcon />,
        MenuProps: { id: 'link-search' },
      },
      {
        label: 'Add new record',
        icon: <AddIcon />,
        nestedItems: [
          { label: 'Ontology', route: '/add/ontology' },
          { label: 'Variant', route: '/add/variant' },
          { label: 'Statement', route: '/add/statement' },
        ],
      },
      {
        label: 'Tutorial',
        icon: <HelpOutlineIcon />,
        route: '/tutorial',
      },
    ];

    const loggedInContent = (
      <Switch>
        <Route exact path="/query" component={QueryView} />
        <Route exact path="/query/advanced" component={AdvancedQueryView} />
        <Route path="/query/advanced/builder" component={QueryBuilderView} />
        <Route path="/add/ontology" component={AddOntologyView} />
        <Route path="/add/variant" component={AddVariantView} />
        <Route path="/add/statement" component={AddStatementView} />
        <Route path="/edit/ontology/:rid" component={EditOntologyView} />
        <Route path="/edit/variant/:rid" component={EditVariantView} />
        <Route path="/edit/statement/:rid" component={EditStatementView} />
        <Route path="/data" component={DataView} />
        <Route path="/feedback" component={FeedbackView} />
        <Route path="/admin" component={AdminView} />
        <Route path="/tutorial" component={TutorialView} />
        <Redirect from="*" to="/query" />
      </Switch>
    );

    return (
      <KBContext.Provider value={{ schema: new Schema(SCHEMA_DEFN), user: auth.getUser() }}>

        <div className="Main">
          <AppBar
            position="absolute"
            className={`banner ${drawerOpen ? 'drawer-shift' : ''}`}
          >
            {!drawerOpen && loggedIn && (
              <IconButton
                color="inherit"
                onClick={this.handleNavBar(true)}
                className="appbar-btn"
              >
                <MenuIcon />
              </IconButton>
            )}
            <div className="appbar-title">
              <Link to="/query" onClick={this.handleNavBar(false)}>
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
                    {(auth.getUser() && auth.getUser().name) || 'Logged Out'}
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
                    <Link to="/feedback">
                      <MenuItem onClick={this.handleClose}>
                        Feedback
                      </MenuItem>
                    </Link>
                    {auth.isAdmin() && (
                      <Link to="/admin">
                        <MenuItem onClick={this.handleClose}>
                          Admin
                        </MenuItem>
                      </Link>
                    )}
                    <MenuItem onClick={this.handleLogOut}>
                      Logout
                    </MenuItem>
                  </Card>
                </Popover>
              </div>
            </div>
          </AppBar>
          {loggedIn && (
            <MainNav open={drawerOpen} onChange={this.handleNavBar} links={links} />
          )}
          <section className={`content ${(drawerOpen ? loggedIn : '') && 'drawer-shift'} ${!loggedIn ? 'no-drawer' : ''}`}>
            <div
              className="router-outlet"
              role="button"
              tabIndex={0}
              onClick={this.handleNavBar(false)}
              onKeyDown={e => e.keyCode === 13 && this.handleNavBar(false)()}
            >
              <Switch>
                <Route path="/login" render={loginWithProps} />
                <Route path="/error" component={ErrorView} />
                {loggedIn
                  ? <Route path="/" render={() => loggedInContent} />
                  : <Redirect push to="/login" />}
              </Switch>
            </div>
          </section>
        </div>
      </KBContext.Provider>
    );
  }
}

export default Main;
