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
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
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
  handleNavBar(state) {
    return () => this.setState({ drawerOpen: state, anchorEl: null });
  }

  render() {
    const {
      anchorEl,
      drawerOpen,
    } = this.state;

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
          { label: 'Ontology', route: '/new/ontology' },
          { label: 'Variant', route: '/new/variant' },
          { label: 'Statement', route: '/new/statement' },
        ],
      },
      {
        label: 'About',
        icon: <HelpOutlineIcon />,
        route: '/about',
      },
    ];

    return (
      <KBContext.Provider value={{ schema: new Schema(), user: auth.getUser() }}>
        <div className="Main">
          <AppBar
            position="absolute"
            className={`banner ${drawerOpen ? 'drawer-shift' : ''}`}
          >
            {!drawerOpen && (
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
                <Typography variant="caption">v{process.env.npm_package_version}</Typography>
              </Link>
            </div>
            <div className="user-dropdown" ref={(node) => { this.dropdown = node; }}>
              <div>
                <Button
                  classes={{ root: 'user-btn' }}
                  onClick={this.handleOpen}
                  size="small"
                  className="appbar-btn"
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
                    <MenuItem onClick={auth.logout}>
                      Logout
                    </MenuItem>
                  </Card>
                </Popover>
              </div>
            </div>
          </AppBar>
          <MainNav open={drawerOpen} onChange={this.handleNavBar} links={links} />
          <section className={`content ${drawerOpen && 'drawer-shift'}`}>
            <div
              className="router-outlet"
              role="button"
              tabIndex={0}
              onClick={this.handleNavBar(false)}
              onKeyDown={e => e.keyCode === 13 && this.handleNavBar(false)()}
            >
              <Switch>
                <AuthenticatedRoute path="/feedback" component={FeedbackView} />
                <Route path="/login" component={LoginView} />
                <Route exact path="/error" component={ErrorView} />
                <AuthenticatedRoute path="/about" component={AboutView} />
                <AuthenticatedRoute exact path="/query" component={QueryView} />
                <AuthenticatedRoute path="/query/advanced/builder" component={QueryBuilderView} />
                <AuthenticatedRoute path="/edit/:rid" component={NodeView} />
                <AuthenticatedRoute path="/new" exact component={NodeView} />
                <AuthenticatedRoute path="/new/:modelName" component={NodeView} />
                <Redirect exact path="/query/advanced" to="/search/v" />
                <AuthenticatedRoute path="/search/:modelName" component={NodeView} />
                <AuthenticatedRoute path="/view/:rid" component={NodeView} />
                <AuthenticatedRoute path="/data" component={DataView} />
                <AuthenticatedRoute path="/admin" admin component={AdminView} />
                <Redirect from="/" to="/query" />
              </Switch>
            </div>
          </section>
        </div>
      </KBContext.Provider>
    );
  }
}

export default Main;