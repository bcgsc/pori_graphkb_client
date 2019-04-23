/**
 * @module /Main
 */
import React from 'react';
import { boundMethod } from 'autobind-decorator';
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

import './Main.scss';
import {
  AboutView,
  AdminView,
  DataView,
  ErrorView,
  FeedbackView,
  LoginView,
  QueryView,
  QueryBuilderView,
} from '..';
import auth from '../../services/auth';
import Schema from '../../services/schema';
import { KBContext } from '../../components/KBContext';
import { MainNav } from './components';
import AuthenticatedRoute from '../../components/AuthenticatedRoute';

import NodeView from '../NodeView';


/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      drawerOpen: false,
      activeLink: '/query',
    };
  }

  /**
   * Opens user dropdown menu.
   */
  @boundMethod
  handleOpen() {
    this.setState({ anchorEl: this.dropdown });
  }

  /**
   * Closes user dropdown menu.
   */
  @boundMethod
  handleClose() {
    this.setState({ anchorEl: null });
  }

  /**
   * Sets main navigation drawer open state.
   */
  @boundMethod
  handleNavBar({ isOpen, activeLink }) {
    this.setState({ drawerOpen: isOpen, anchorEl: null, activeLink });
  }

  @boundMethod
  handleOpenNavBar() {
    this.setState({ drawerOpen: true });
  }

  @boundMethod
  handleCloseNavBar() {
    this.setState({ drawerOpen: false });
  }

  render() {
    const {
      anchorEl,
      drawerOpen,
      activeLink,
    } = this.state;

    return (
      <KBContext.Provider value={{ schema: new Schema(), user: auth.getUser() }}>
        <div className="main-view">
          <AppBar
            position="fixed"
            className={`appbar ${drawerOpen ? 'appbar--drawer-open' : ''}`}
          >
            <IconButton
              color="inherit"
              onClick={this.handleOpenNavBar}
              className={`appbar__btn ${drawerOpen ? 'appbar__btn--drawer-open' : ''}`}
            >
              <MenuIcon />
            </IconButton>
            <div className={`appbar__title ${drawerOpen ? 'appbar__title--drawer-open' : ''}`}>
              <Link to="/query" onClick={this.handleCloseNavBar}>
                <Typography variant="h6">GraphKB</Typography>
                <Typography variant="caption">v{process.env.npm_package_version}</Typography>
              </Link>
            </div>
            <div className="user-dropdown" ref={(node) => { this.dropdown = node; }}>
              <div>
                <Button
                  classes={{ root: 'user-dropdown__icon' }}
                  onClick={this.handleOpen}
                  size="small"
                >
                  <PersonIcon />
                  <Typography color="inherit">
                    {auth.isAuthorized()
                      ? auth.getUser().name
                      : 'Logged Out'
                    }
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
                  <Card className="user-dropdown__content">
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
                    <MenuItem onClick={auth.logout}>
                      {
                        auth.isAuthorized()
                          ? 'Logout'
                          : 'Login'
                      }
                    </MenuItem>
                  </Card>
                </Popover>
              </div>
            </div>
          </AppBar>
          <MainNav isOpen={drawerOpen} onChange={this.handleNavBar} activeLink={activeLink} />
          <section className={`main-view__content ${drawerOpen ? 'main-view__content--drawer-open' : ''}`}>
            <Switch>
              <AuthenticatedRoute path="/feedback" component={FeedbackView} />
              <Route path="/login" component={LoginView} />
              <Route exact path="/error" component={ErrorView} />
              <Route path="/about" component={AboutView} />
              <AuthenticatedRoute exact path="/query" component={QueryView} />
              <AuthenticatedRoute path="/query/advanced/builder" component={QueryBuilderView} />
              <AuthenticatedRoute path="/edit/:modelName/:rid" component={NodeView} />
              <AuthenticatedRoute path="/edit/:rid" component={NodeView} />
              <AuthenticatedRoute path="/new" exact component={NodeView} />
              <AuthenticatedRoute path="/new/:modelName" component={NodeView} />
              <Redirect exact path="/query/advanced" to="/search/v" />
              <AuthenticatedRoute path="/search/:modelName" component={NodeView} />
              <AuthenticatedRoute path="/view/:modelName/:rid" component={NodeView} />
              <AuthenticatedRoute path="/view/:rid" component={NodeView} />
              <AuthenticatedRoute path="/data" component={DataView} />
              <AuthenticatedRoute path="/admin" admin component={AdminView} />
              <Redirect from="/" to="/query" />
            </Switch>
          </section>
        </div>
      </KBContext.Provider>
    );
  }
}

export default Main;
