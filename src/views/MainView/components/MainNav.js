import {
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import InputIcon from '@material-ui/icons/Input';
import SearchIcon from '@material-ui/icons/Search';
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Link,
} from 'react-router-dom';

import { SecurityContext } from '@/components/SecurityContext';
import { hasWriteAccess, isAdmin, isAuthorized } from '@/services/auth';
import logo from '@/static/logo.png';
import title from '@/static/title.png';

/**
 * @property {object} props
 * @property {boolean} props.open - drawer open state.
 * @property {Array} props.links - List of app links to display in sidebar.
 * @property {function} props.onChange - handler for siderbar state change.
 */
class MainNav extends React.PureComponent {
  static propTypes = {
    activeLink: PropTypes.string,
    isOpen: PropTypes.bool,
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
      subMenuOpenLink: '/query',
    };
  }

  static contextType = SecurityContext;

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
    this.setState({ subMenuOpenLink: defaultRoute });
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
    const { subMenuOpenLink } = this.state;

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
        <Link key={label.toLowerCase()} to={route}>
          <MenuItem onClick={() => { this.handleClickLink(route, topLevel ? route : null); }}>
            {icon && <ListItemIcon>{icon}</ListItemIcon>}
            <ListItemText
              inset={inset}
            >
              <Typography className={`main-nav-drawer__link${selected ? '--selected' : ''}`} color="secondary" variant="body1">
                {label}
              </Typography>
            </ListItemText>
          </MenuItem>
        </Link>
      );
    };

    return (
      <Drawer
        anchor="left"
        classes={{
          paper: `main-nav-drawer main-nav-drawer${isOpen ? '' : '--closed'}`,
        }}
        open
        variant="persistent"
      >
        <div className="main-nav-drawer__banner">
          <IconButton onClick={this.handleClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className="main-nav-drawer__links">
          {isAuthorized(this.context) && (
            <MenuLink icon={<SearchIcon />} label="Search" route="/query" topLevel />
          )}
          {isAuthorized(this.context) && (isOpen && subMenuOpenLink === '/query') && (
            <>
              <MenuLink inset label="Quick" route="/query" />
              <MenuLink inset label="Popular" route="/query-popular/gene" />
              <MenuLink inset label="Advanced" route="/query-advanced" />
            </>
          )}
          {hasWriteAccess(this.context) && (
            <MenuLink icon={<AddIcon />} label="Add new Record" route="/new/ontology" topLevel />
          )}
          {hasWriteAccess(this.context) && (isOpen && subMenuOpenLink === '/new/ontology') && (
            <>
              {isAdmin(this.context) && (<MenuLink inset label="Source*" route="/new/source" />)}
              <MenuLink inset label="Ontology" route="/new/ontology" />
              <MenuLink inset label="Variant" route="/new/variant" />
              <MenuLink inset label="Statement" route="/new/statement" />
              <MenuLink inset label="Relationship" route="/new/e" />
            </>
          )}
          {hasWriteAccess(this.context) && (
            <MenuItem onClick={() => this.handleOpen('import')}>
              <ListItemIcon><InputIcon /></ListItemIcon>
              <ListItemText primary="Import" />
            </MenuItem>
          )}
          {hasWriteAccess(this.context) && (isOpen && subMenuOpenLink === 'import') && (
            <>
              <MenuLink inset label="PubMed" route="/import/pubmed" />
            </>
          )}
          <MenuLink icon={<HelpOutlineIcon />} label="About" route="/about" />
        </List>
        <div className="main-nav-drawer__footer">
          <Divider />
          <ListItem dense>
            <ListItemIcon>
              <img alt="" id="bcc-logo" src={logo} />
            </ListItemIcon>
            <img alt="" id="bcc-label" src={title} />
          </ListItem>
        </div>
      </Drawer>
    );
  }
}

export default MainNav;
