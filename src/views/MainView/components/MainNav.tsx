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
import React, { useCallback, useContext, useState } from 'react';

import ActiveLinkContext from '@/components/ActiveLinkContext';
import { useAuth } from '@/components/Auth';
import logo from '@/static/gsclogo.svg';

import MenuLink from './MenuLink';

interface MainNavProps {
  isOpen: boolean;
  onChange: (arg: { isOpen: boolean })=> void;
}

const MainNav = ({ isOpen = false, onChange }: MainNavProps) => {
  const [subMenuOpenLink, setSubMenuOpenLink] = useState('/query');
  const auth = useAuth();
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
        {auth.hasWriteAccess && (
          <MenuItem onClick={() => handleOpen('/new/ontology')}>
            <ListItemIcon><AddIcon /></ListItemIcon>
            <ListItemText primary="Add new Record" />
          </MenuItem>
        )}
        {auth.hasWriteAccess && isOpen && subMenuOpenLink === '/new/ontology' && (
          <>
            {auth.isAdmin && (
              <MenuLink
                inset
                label="Source*"
                onClick={handleClickLink}
                route="/new/source"
              />
            )}
            <MenuLink
              inset
              label="Ontology"
              onClick={handleClickLink}
              route="/new/ontology"
            />
            <MenuLink
              inset
              label="Variant"
              onClick={handleClickLink}
              route="/new/variant"
            />
            <MenuLink
              inset
              label="Statement"
              onClick={handleClickLink}
              route="/new/statement"
            />
            <MenuLink
              inset
              label="Relationship"
              onClick={handleClickLink}
              route="/new/e"
            />
          </>
        )}
        {auth.hasWriteAccess && (
          <MenuItem onClick={() => handleOpen('import')}>
            <ListItemIcon>
              <InputIcon />
            </ListItemIcon>
            <ListItemText primary="Import" />
          </MenuItem>
        )}
        {auth.hasWriteAccess && isOpen && subMenuOpenLink === 'import' && (
          <>
            <MenuLink
              inset
              label="PubMed"
              onClick={handleClickLink}
              route="/import/pubmed"
            />
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

export default MainNav;
