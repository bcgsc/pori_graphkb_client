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
            <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} icon={<SearchIcon />} label="Search" route="/query" topLevel />
          )}
          {isAuthorized(this.context) && (isOpen && subMenuOpenLink === '/query') && (
            <>
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="Quick" route="/query" />
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="Popular" route="/query-popular/gene" />
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="Advanced" route="/query-advanced" />
            </>
          )}
          {hasWriteAccess(this.context) && (
            <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} icon={<AddIcon />} label="Add new Record" route="/new/ontology" topLevel />
          )}
          {hasWriteAccess(this.context) && (isOpen && subMenuOpenLink === '/new/ontology') && (
            <>
              {isAdmin(this.context) && (
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="Source*" route="/new/source" />)}
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="Ontology" route="/new/ontology" />
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="Variant" route="/new/variant" />
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="Statement" route="/new/statement" />
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="Relationship" route="/new/e" />
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
              <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} inset label="PubMed" route="/import/pubmed" />
            </>
          )}
          <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} icon={<TrendingUpIcon />} label="Activity" route="/activity" />
          <MenuLink activeLink={activeLink} handleClickLink={this.handleClickLink} icon={<HelpOutlineIcon />} label="About" route="/about" />
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
