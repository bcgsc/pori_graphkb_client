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
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { boundMethod } from 'autobind-decorator';
import SearchIcon from '@material-ui/icons/Search';
import AddIcon from '@material-ui/icons/Add';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

import logo from '../../../static/logo.png';
import title from '../../../static/title.png';
import { KBContext } from '../../../components/KBContext';


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

  /**
   * Handles closing of drawer.
   */
  @boundMethod
  handleClose() {
    const { onChange, activeLink } = this.props;
    onChange({ isOpen: false, activeLink });
  }

  @boundMethod
  handleOpen() {
    const { onChange, activeLink } = this.props;
    onChange({ isOpen: true, activeLink });
  }

  @boundMethod
  handleClickLink(link) {
    const { isOpen, onChange } = this.props;
    onChange({ isOpen, activeLink: link });
  }

  render() {
    const { isOpen, activeLink } = this.props;
    const { auth } = this.context;

    const MenuLink = ({
      route, label, icon = null, inset = false,
    }) => (
      <Link to={route} key={label.toLowerCase()}>
        <MenuItem onClick={() => this.handleClickLink(route)}>
          {icon && <ListItemIcon>{icon}</ListItemIcon>}
          <ListItemText
            inset={inset}
            primary={label}
            primaryTypographyProps={{
              color: activeLink === route ? 'secondary' : undefined,
            }}
          />
        </MenuItem>
      </Link>
    );

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
          <MenuLink label="Query" route="/query" icon={<SearchIcon />} />
          {auth.hasWriteAccess() && (
            <MenuItem onClick={this.handleOpen}>
              <ListItemIcon> <AddIcon /> </ListItemIcon>
              <ListItemText primary="Add new Record" />
            </MenuItem>
          )}
          {auth.hasWriteAccess() && isOpen && (
            <>
              <MenuLink label="Source" route="/new/source" inset />
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
