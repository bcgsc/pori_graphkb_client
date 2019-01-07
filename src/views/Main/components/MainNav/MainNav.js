import React, { Component } from 'react';
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
  Collapse,
  MenuItem,
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import logo from '../../../../static/logo.png';
import title from '../../../../static/title.png';

class MainNav extends Component {
  constructor(props) {
    super(props);
    this.state = { expanded: '' };
    this.handleExpand = this.handleExpand.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.renderLink = this.renderLink.bind(this);
  }

  /**
   * Expands a list item in the main navigation drawer.
   * @param {string} key - Item key to expand in main navigation drawer.
   */
  handleExpand(key) {
    const { open, onChange } = this.props;
    return () => {
      const { expanded } = this.state;
      this.setState({ expanded: expanded === key ? '' : key });
      if (!open) {
        onChange(true)();
      }
    };
  }

  /**
   * Handles closing of drawer.
   */
  handleClose() {
    const { onChange } = this.props;
    onChange(false)();
    this.setState({ expanded: '' });
  }

  /**
   * Handles render of a nav drawer list item.
   */
  renderLink(link, nested) {
    const {
      open,
    } = this.props;

    const { expanded } = this.state;

    const {
      label,
      route,
      icon,
      MenuProps,
      nestedItems,
    } = link;

    if (nestedItems) {
      const active = expanded === label.toLowerCase() && open;
      return (
        <React.Fragment key={label.toLowerCase()}>
          <MenuItem {...MenuProps} onClick={this.handleExpand(label.toLowerCase())}>
            <ListItemIcon>
              {React.cloneElement(icon, { color: active ? 'secondary' : undefined })}
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                color: active ? 'secondary' : undefined,
              }}
              primary={label}
            />
          </MenuItem>
          <Collapse in={active}>
            {nestedItems.map(nestedItem => this.renderLink(nestedItem, true))}
          </Collapse>
        </React.Fragment>
      );
    }
    return (
      <Link to={route} key={label.toLowerCase()}>
        <MenuItem {...MenuProps} onClick={this.handleClose}>
          {icon && <ListItemIcon>{icon}</ListItemIcon>}
          <ListItemText inset={nested} primary={label} />
        </MenuItem>
      </Link>
    );
  }

  render() {
    const { open, links } = this.props;

    return (
      <Drawer
        variant="persistent"
        open
        anchor="left"
        classes={{
          paper: `drawer${open ? '' : ' drawer-closed'}`,
        }}
      >
        <div className="banner drawer-logo">
          <IconButton
            onClick={this.handleClose}
          >
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className="drawer-links">
          {links.map(link => this.renderLink(link, false))}
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
  }
}

/**
 * @namespace
 * @property {boolean} open - drawer open state.
 * @property {Array} links - List of app links to display in sidebar.
 * @property {function} onChange - handler for siderbar state change.
 */
MainNav.propTypes = {
  open: PropTypes.bool,
  links: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    route: PropTypes.string,
    icon: PropTypes.node,
    MenuProps: PropTypes.object,
    nestedItems: PropTypes.array,
  })),
  onChange: PropTypes.func,
};

MainNav.defaultProps = {
  open: false,
  links: [],
  onChange: () => { },
};

export default MainNav;
