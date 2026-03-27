import {
  Link,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from '@mui/material';
import React from 'react';
import { NavLink } from 'react-router-dom';

interface MenuLinkProps {
  /** text label of navigation link */
  label: string;
  /** callback fn for when this item is clicked */
  onClick: (route: string, arg: string | null) => void;
  /** link route name */
  route: string;
  group?: boolean;
  icon?: Record<string, unknown>;
  /** if true, text will be indented */
  inset?: boolean;
}

/**
 * Text link with optional icon to navigate through application
 */
const MenuLink = ({
  route, label, icon, inset, group, onClick,
}: MenuLinkProps) => (
  <Link key={label.toLowerCase()} className="navlink" color="inherit" component={NavLink} to={route} underline="none" variant="body1">
    <MenuItem onClick={() => onClick(route, group ? route : null)}>
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText
        inset={inset}
      >
        <Typography variant="body1">
          {label}
        </Typography>
      </ListItemText>
    </MenuItem>
  </Link>
);

MenuLink.defaultProps = {
  icon: null,
  inset: false,
  group: false,
};

export default MenuLink;
