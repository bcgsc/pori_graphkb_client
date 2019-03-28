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

import logo from '../../../../static/logo.png';
import title from '../../../../static/title.png';


/**
 * @property {object} props
 * @property {boolean} props.open - drawer open state.
 * @property {Array} props.links - List of app links to display in sidebar.
 * @property {function} props.onChange - handler for siderbar state change.
 */
class MainNav extends React.PureComponent {
  static propTypes = {
    isOpen: PropTypes.bool,
    activeLink: PropTypes.string,
    links: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      route: PropTypes.string,
      icon: PropTypes.node,
      MenuProps: PropTypes.object,
      nestedItems: PropTypes.array,
    })),
    onChange: PropTypes.func,
  };

  static defaultProps = {
    isOpen: false,
    links: [],
    onChange: () => {},
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

  /**
   * Handles render of a nav drawer list item.
   */
  @boundMethod
  renderLink(link, isNested = false) {
    const { isOpen, activeLink } = this.props;

    const {
      label,
      route,
      icon,
      MenuProps,
      nestedItems,
    } = link;

    const isActive = route === activeLink;

    if (nestedItems) {
      return (
        <React.Fragment key={label.toLowerCase()}>
          <MenuItem {...MenuProps} onClick={this.handleOpen}>
            <ListItemIcon>
              {React.cloneElement(icon, { color: isActive ? 'secondary' : undefined })}
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                color: isActive ? 'secondary' : undefined,
              }}
              primary={label}
            />
          </MenuItem>
          {isOpen && nestedItems.map(nestedItem => this.renderLink(nestedItem, true))}
        </React.Fragment>
      );
    }
    return (
      <Link to={route} key={label.toLowerCase()}>
        <MenuItem {...MenuProps} onClick={() => this.handleClickLink(route)}>
          {icon && <ListItemIcon>{icon}</ListItemIcon>}
          <ListItemText
            inset={isNested}
            primary={label}
            primaryTypographyProps={{
              color: isActive ? 'secondary' : undefined,
            }}
          />
        </MenuItem>
      </Link>
    );
  }

  render() {
    const { isOpen, links } = this.props;

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
          <IconButton
            onClick={this.handleClose}
          >
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className="main-nav-drawer__links">
          {links.map(link => this.renderLink(link, false))}
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
