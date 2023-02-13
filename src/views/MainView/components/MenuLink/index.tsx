import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from '@material-ui/core';
import React, {
  ReactNode,
  useCallback, useContext, useEffect, useState,
} from 'react';
import {
  Link,
} from 'react-router-dom';

import ActiveLinkContext from '@/components/ActiveLinkContext';

interface MenuLinkProps {
  /** text label of navigation link */
  label: string;
  /** callback fn for when this item is clicked */
  onClick: (route: string, arg: string | null) => void;
  /** link route name */
  route: string;
  icon?: ReactNode;
  /** if true, text will be indented */
  inset?: boolean;
}

/**
 * Text link with optional icon to navigate through application
 */
const MenuLink = ({
  route, label, icon, inset, onClick,
}: MenuLinkProps) => {
  const { activeLink, setActiveLink } = useContext(ActiveLinkContext);
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const selected = (activeLink === route);
    setIsSelected(selected);
  }, [activeLink, route]);

  const handleClick = useCallback(() => {
    onClick(route, null);
    setActiveLink(route);
  }, [onClick, route, setActiveLink]);

  return (
    <Link key={label.toLowerCase()} to={route}>
      <MenuItem onClick={handleClick}>
        {icon && <ListItemIcon>{icon}</ListItemIcon>}
        <ListItemText
          inset={inset}
        >
          <Typography className={`main-nav-drawer__link${isSelected ? '--selected' : ''}`} color="secondary" variant="body1">
            {label}
          </Typography>
        </ListItemText>
      </MenuItem>
    </Link>
  );
};

MenuLink.defaultProps = {
  icon: null,
  inset: false,
};

export default MenuLink;
