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
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

import { SecurityContext } from '@/components/SecurityContext';
import { hasWriteAccess, isAdmin, isAuthorized } from '@/services/auth';
import logo from '@/static/logo.png';

import MenuLink from './MenuLink';

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
            <MenuLink activeLink={activeLink} icon={<SearchIcon />} label="Search" onClick={this.handleClickLink} route="/query" topLevel />
          )}
          {isAuthorized(this.context) && (isOpen && subMenuOpenLink === '/query') && (
            <>
              <MenuLink activeLink={activeLink} inset label="Quick" onClick={this.handleClickLink} route="/query" />
              <MenuLink activeLink={activeLink} inset label="Popular" onClick={this.handleClickLink} route="/query-popular/gene" />
              <MenuLink activeLink={activeLink} inset label="Advanced" onClick={this.handleClickLink} route="/query-advanced" />
            </>
          )}
          {hasWriteAccess(this.context) && (
            <MenuLink activeLink={activeLink} icon={<AddIcon />} label="Add new Record" onClick={this.handleClickLink} route="/new/ontology" topLevel />
          )}
          {hasWriteAccess(this.context) && (isOpen && subMenuOpenLink === '/new/ontology') && (
            <>
              {isAdmin(this.context) && (
                <MenuLink activeLink={activeLink} inset label="Source*" onClick={this.handleClickLink} route="/new/source" />
              )}
              <MenuLink activeLink={activeLink} inset label="Ontology" onClick={this.handleClickLink} route="/new/ontology" />
              <MenuLink activeLink={activeLink} inset label="Variant" onClick={this.handleClickLink} route="/new/variant" />
              <MenuLink activeLink={activeLink} inset label="Statement" onClick={this.handleClickLink} route="/new/statement" />
              <MenuLink activeLink={activeLink} inset label="Relationship" onClick={this.handleClickLink} route="/new/e" />
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
              <MenuLink activeLink={activeLink} inset label="PubMed" onClick={this.handleClickLink} route="/import/pubmed" />
            </>
          )}
          <MenuLink activeLink={activeLink} icon={<TrendingUpIcon />} label="Activity" onClick={this.handleClickLink} route="/activity" />
          <MenuLink activeLink={activeLink} icon={<HelpOutlineIcon />} label="About" onClick={this.handleClickLink} route="/about" />
        </List>
        <div className="main-nav-drawer__footer">
          <Divider />
          <ListItem dense>
            <img alt="" id="bcc-logo" src={logo} />
            <Typography className="footer__label" variant="caption">Genome Sciences Centre</Typography>
          </ListItem>
        </div>
      </Drawer>
    );
  }
}

export default MainNav;
