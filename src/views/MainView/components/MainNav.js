import React from 'react';
import PropTypes from 'prop-types';
import {
  Link,
} from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  IconButton,
  ListItemText,
  ListItemIcon,
  Divider,
  MenuItem,
  Typography,
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { boundMethod } from 'autobind-decorator';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

import logo from '../../../static/logo.png';
import title from '../../../static/title.png';
import { KBContext } from '../../../components/KBContext';
import { hasWriteAccess, isAdmin, isAuthorized } from '../../../services/auth';

/**
 * @property {object} props
 * @property {boolean} props.open - drawer open state.
 * @property {Array} props.links - List of app links to display in sidebar.
 * @property {function} props.onChange - handler for siderbar state change.
 */
class MainNav extends React.PureComponent {
  static contextType = KBContext;

  static propTypes = {
    isOpen: PropTypes.bool,
    activeLink: PropTypes.string,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    isOpen: false,
    onChange: () => { },
    activeLink: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      subMenuOpen: '/query',
    };
  }

  /**
   * Handles closing of drawer.
   */
  @boundMethod
  handleClose() {
    const { onChange, activeLink } = this.props;
    onChange({ isOpen: false, activeLink });
  }

  @boundMethod
  handleOpen(defaultRoute) {
    const { onChange } = this.props;
    onChange({ isOpen: true, activeLink: defaultRoute });
    this.setState({ subMenuOpen: defaultRoute });
  }

  @boundMethod
  handleClickLink(link, topLevel) {
    if (topLevel) {
      this.handleOpen(topLevel);
    } else {
      const { isOpen, onChange } = this.props;
      onChange({ isOpen, activeLink: link });
    }
  }

  render() {
    const { isOpen, activeLink } = this.props;
    const { subMenuOpen } = this.state;

    /**
     * Text link with optional icon to navigate through application
     *
     * @property {string} route link route name
     * @property {string} label text label of navigation link
     * @property {bool} inset if true, text will be indented
     * @property {string} topLevel indicates if topLevel link i.e Search, Add
     */
    const MenuLink = ({
      route, label, icon = null, inset = false, topLevel,
    }) => {
      const selected = (activeLink === route) && (!topLevel);
      return (
        <Link to={route} key={label.toLowerCase()}>
          <MenuItem onClick={() => { this.handleClickLink(route, topLevel ? route : null); }}>
            {icon && <ListItemIcon>{icon}</ListItemIcon>}
            <ListItemText
              inset={inset}
            >
              <Typography variant="body1" className={`main-nav-drawer__link${selected ? '--selected' : ''}`}>
                {label}
              </Typography>
            </ListItemText>
          </MenuItem>
        </Link>
      );
    };

    return (
      <Drawer
        variant="persistent"
        open
        anchor="left"
        classes={{
          paper: `main-nav-drawer main-nav-drawer${isOpen ? '' : '--closed'}`,
        }}
      >
        <div className="main-nav-drawer__banner">
          <IconButton onClick={this.handleClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className="main-nav-drawer__links">
          {isAuthorized(this.context) && (
            <MenuLink label="Search" route="/query" icon={<SearchIcon />} topLevel />
          )}
          {isAuthorized(this.context) && (isOpen && subMenuOpen === '/query') && (
            <>
              <MenuLink label="Quick" route="/query" inset />
              <MenuLink label="Popular" route="/query-popular/gene" inset />
              <MenuLink label="Advanced" route="/query-advanced" inset />
            </>
          )}
          {hasWriteAccess(this.context) && (
            <MenuLink label="Add new Record" route="/new/ontology" icon={<AddIcon />} topLevel />
          )}
          {hasWriteAccess(this.context) && (isOpen && subMenuOpen === '/new/ontology') && (
            <>
              {isAdmin(this.context) && (<MenuLink label="Source*" route="/new/source" inset />)}
              <MenuLink label="Ontology" route="/new/ontology" inset />
              <MenuLink label="Variant" route="/new/variant" inset />
              <MenuLink label="Statement" route="/new/statement" inset />
              <MenuLink label="Relationship" route="/new/e" inset />
            </>
          )}
          <MenuLink label="About" route="/about" icon={<HelpOutlineIcon />} />
        </List>
        <div className="main-nav-drawer__footer">
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
  }
}

export default MainNav;
