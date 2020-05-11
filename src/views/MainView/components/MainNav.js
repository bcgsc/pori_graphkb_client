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
import PropTypes from 'prop-types';
import React, { useCallback, useContext, useState } from 'react';

import { SecurityContext } from '@/components/SecurityContext';
import { hasWriteAccess, isAdmin, isAuthorized } from '@/services/auth';
import logo from '@/static/gsclogo.svg';

import MenuLink from './MenuLink';

/**
 * @property {object} props
 * @property {boolean} props.open - drawer open state.
 * @property {Array} props.links - List of app links to display in sidebar.
 * @property {function} props.onChange - handler for siderbar state change.
 */
const MainNav = ({ isOpen, activeLink, onChange }) => {
  const [subMenuOpenLink, setSubMenuOpenLink] = useState('/query');
  const context = useContext(SecurityContext);

  /**
   * Handles closing of drawer.
   */
  const handleClose = useCallback(() => {
    onChange({ isOpen: false, activeLink });
  }, [activeLink, onChange]);

  const handleOpen = useCallback((defaultRoute) => {
    onChange({ isOpen: true, activeLink: defaultRoute });
    setSubMenuOpenLink(defaultRoute);
  }, [onChange]);

  const handleClickLink = useCallback((link, topLevel) => {
    if (topLevel) {
      handleOpen(topLevel);
    } else {
      onChange({ isOpen, activeLink: link });
    }
  }, [handleOpen, isOpen, onChange]);

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
        <IconButton onClick={handleClose}>
          <ChevronLeftIcon />
        </IconButton>
      </div>
      <Divider />
      <List className="main-nav-drawer__links">
        {isAuthorized(context) && (
        <MenuLink activeLink={activeLink} icon={<SearchIcon />} label="Search" onClick={handleClickLink} route="/query" topLevel />
        )}
        {isAuthorized(context) && (isOpen && subMenuOpenLink === '/query') && (
        <>
          <MenuLink activeLink={activeLink} inset label="Quick" onClick={handleClickLink} route="/query" />
          <MenuLink activeLink={activeLink} inset label="Popular" onClick={handleClickLink} route="/query-popular/gene" />
          <MenuLink activeLink={activeLink} inset label="Advanced" onClick={handleClickLink} route="/query-advanced" />
        </>
        )}
        {hasWriteAccess(context) && (
        <MenuLink activeLink={activeLink} icon={<AddIcon />} label="Add new Record" onClick={handleClickLink} route="/new/ontology" topLevel />
        )}
        {hasWriteAccess(context) && (isOpen && subMenuOpenLink === '/new/ontology') && (
        <>
          {isAdmin(context) && (
          <MenuLink activeLink={activeLink} inset label="Source*" onClick={handleClickLink} route="/new/source" />
          )}
          <MenuLink activeLink={activeLink} inset label="Ontology" onClick={handleClickLink} route="/new/ontology" />
          <MenuLink activeLink={activeLink} inset label="Variant" onClick={handleClickLink} route="/new/variant" />
          <MenuLink activeLink={activeLink} inset label="Statement" onClick={handleClickLink} route="/new/statement" />
          <MenuLink activeLink={activeLink} inset label="Relationship" onClick={handleClickLink} route="/new/e" />
        </>
        )}
        {hasWriteAccess(context) && (
        <MenuItem onClick={() => handleOpen('import')}>
          <ListItemIcon><InputIcon /></ListItemIcon>
          <ListItemText primary="Import" />
        </MenuItem>
        )}
        {hasWriteAccess(context) && (isOpen && subMenuOpenLink === 'import') && (
        <>
          <MenuLink activeLink={activeLink} inset label="PubMed" onClick={handleClickLink} route="/import/pubmed" />
        </>
        )}
        <MenuLink activeLink={activeLink} icon={<TrendingUpIcon />} label="Activity" onClick={handleClickLink} route="/activity" />
        <MenuLink activeLink={activeLink} icon={<HelpOutlineIcon />} label="About" onClick={handleClickLink} route="/about" />
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
};


MainNav.propTypes = {
  activeLink: PropTypes.string,
  isOpen: PropTypes.bool,
  onChange: PropTypes.func,
};

MainNav.defaultProps = {
  isOpen: false,
  onChange: () => { },
  activeLink: null,
};

export default MainNav;
