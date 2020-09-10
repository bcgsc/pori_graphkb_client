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
import HomeIcon from '@material-ui/icons/Home';
import InputIcon from '@material-ui/icons/Input';
import SearchIcon from '@material-ui/icons/Search';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import PropTypes from 'prop-types';
import React, { useCallback, useContext, useState } from 'react';

import ActiveLinkContext from '@/components/ActiveLinkContext';
import { SecurityContext } from '@/components/SecurityContext';
import { hasWriteAccess, isAdmin } from '@/services/auth';
import logo from '@/static/gsclogo.svg';

import MenuLink from './MenuLink';

/**
 * @property {object} props
 * @property {boolean} props.open - drawer open state.
 * @property {Array} props.links - List of app links to display in sidebar.
 * @property {function} props.onChange - handler for siderbar state change.
 */
const MainNav = ({ isOpen, onChange }) => {
  const [subMenuOpenLink, setSubMenuOpenLink] = useState('/query');
  const context = useContext(SecurityContext);
  const { setActiveLink } = useContext(ActiveLinkContext);

  /**
   * Handles closing of drawer.
   */
  const handleClose = useCallback(() => {
    onChange({ isOpen: false });
  }, [onChange]);

  const handleOpen = useCallback((defaultRoute) => {
    onChange({ isOpen: true });
    setSubMenuOpenLink(defaultRoute);
  }, [onChange]);

  const handleClickLink = useCallback((link, group) => {
    if (group) {
      handleOpen(group);
    } else {
      setActiveLink(link);
      onChange({ isOpen });
    }
  }, [handleOpen, isOpen, onChange, setActiveLink]);

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
        <MenuLink icon={<HomeIcon />} label="Quick Search" onClick={handleClickLink} route="/query" />
        <MenuLink icon={<SearchIcon />} label="Advanced Search" onClick={handleClickLink} route="/query-advanced" />
        {hasWriteAccess(context) && (
        <MenuLink group icon={<AddIcon />} label="Add new Record" onClick={handleClickLink} />
        )}
        {hasWriteAccess(context) && (isOpen && subMenuOpenLink === '/new/ontology') && (
        <>
          {isAdmin(context) && (
          <MenuLink inset label="Source*" onClick={handleClickLink} route="/new/source" />
          )}
          <MenuLink inset label="Ontology" onClick={handleClickLink} route="/new/ontology" />
          <MenuLink inset label="Variant" onClick={handleClickLink} route="/new/variant" />
          <MenuLink inset label="Statement" onClick={handleClickLink} route="/new/statement" />
          <MenuLink inset label="Relationship" onClick={handleClickLink} route="/new/e" />
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
          <MenuLink inset label="PubMed" onClick={handleClickLink} route="/import/pubmed" />
        </>
        )}
        <MenuLink icon={<TrendingUpIcon />} label="Activity" onClick={handleClickLink} route="/activity" />
        <MenuLink icon={<HelpOutlineIcon />} label="About" onClick={handleClickLink} route="/about" />
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
  isOpen: PropTypes.bool,
  onChange: PropTypes.func,
};

MainNav.defaultProps = {
  isOpen: false,
  onChange: () => { },
};

export default MainNav;
