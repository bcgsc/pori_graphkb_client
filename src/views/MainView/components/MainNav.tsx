import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HomeIcon from '@mui/icons-material/Home';
import InputIcon from '@mui/icons-material/Input';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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
} from '@mui/material';
import React, { useState } from 'react';
import { NavLink } from 'react-router';

import { useAuth } from '@/components/Auth';
import logo from '@/static/gsclogo.svg';

interface MainNavProps {
  isOpen?: boolean;
  onChange?: (arg: { isOpen: boolean })=> void;
}

const MainNav = ({ isOpen = false, onChange }: MainNavProps) => {
  const auth = useAuth();
  const [subMenuOpenLink, setSubMenuOpenLink] = useState<'new' | 'import' | null>(null);

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
        <IconButton
          onClick={() => {
            onChange?.({ isOpen: !isOpen });
            setSubMenuOpenLink(null);
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </div>
      <Divider />
      <List className="main-nav-drawer__links" component="nav" dense>
        <MenuItem component={NavLink} to="/query">
          <ListItemIcon><HomeIcon /></ListItemIcon>
          <ListItemText primary="Quick Search" />
        </MenuItem>
        <MenuItem component={NavLink} to="/query-advanced">
          <ListItemIcon><SearchIcon /></ListItemIcon>
          <ListItemText primary="Advanced Search" />
        </MenuItem>
        {auth.hasWriteAccess && (
          <MenuItem
            onClick={() => {
              setSubMenuOpenLink((prev) => (!isOpen || prev !== 'new' ? 'new' : null));
              onChange?.({ isOpen: true });
            }}
          >
            <ListItemIcon><AddIcon /></ListItemIcon>
            <ListItemText primary="Add new Record" />
          </MenuItem>
        )}
        {auth.hasWriteAccess && subMenuOpenLink === 'new' && (
          <>
            {auth.isAdmin && (
            <MenuItem component={NavLink} to="/new/source">
              <ListItemText inset primary="Source*" />
            </MenuItem>
            )}
            <MenuItem component={NavLink} to="/new/ontology">
              <ListItemText inset primary="Ontology" />
            </MenuItem>
            <MenuItem component={NavLink} to="/new/variant">
              <ListItemText inset primary="Variant" />
            </MenuItem>
            <MenuItem component={NavLink} to="/new/statement">
              <ListItemText inset primary="Statement" />
            </MenuItem>
            <MenuItem component={NavLink} to="/new/e">
              <ListItemText inset primary="Relationship" />
            </MenuItem>
          </>
        )}
        {auth.hasWriteAccess && (
          <MenuItem
            onClick={() => {
              setSubMenuOpenLink((prev) => (!isOpen || prev !== 'import' ? 'import' : null));
              onChange?.({ isOpen: true });
            }}
          >
            <ListItemIcon><InputIcon /></ListItemIcon>
            <ListItemText primary="Import" />
          </MenuItem>
        )}
        {auth.hasWriteAccess && subMenuOpenLink === 'import' && (
          <>
            <MenuItem component={NavLink} to="/import/pubmed">
              <ListItemText inset primary="PubMed" />
            </MenuItem>
          </>
        )}
        <MenuItem component={NavLink} to="/activity">
          <ListItemIcon><TrendingUpIcon /></ListItemIcon>
          <ListItemText primary="Activity" />
        </MenuItem>
        <MenuItem component={NavLink} to="/about">
          <ListItemIcon><HelpOutlineIcon /></ListItemIcon>
          <ListItemText primary="About" />
        </MenuItem>
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
