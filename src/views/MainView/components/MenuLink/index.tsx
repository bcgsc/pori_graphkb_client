import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';
import {
  Link,
} from 'react-router-dom';

import ActiveLinkContext from '@/components/ActiveLinkContext';

/**
 * Text link with optional icon to navigate through application
 *
 * @property {string} route link route name
 * @property {string} label text label of navigation link
 * @property {bool} inset if true, text will be indented
 * @property {boolean} topLevel indicates if topLevel link i.e Search, Add
 * @property {function} onClick callback fn for when this item is clicked
 * @property {string} activeLink the current page(link) the user is on
 */
const MenuLink = ({
  route, label, icon, inset, group, onClick,
}) => {
  const { activeLink, setActiveLink } = useContext(ActiveLinkContext);
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const selected = (activeLink === route) && (!group);
    setIsSelected(selected);
  }, [activeLink, group, route]);

  const handleClick = useCallback(() => {
    onClick(route, group ? route : null);
    setActiveLink(route);
  }, [group, onClick, route, setActiveLink]);

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

MenuLink.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  route: PropTypes.string.isRequired,
  group: PropTypes.bool,
  icon: PropTypes.object,
  inset: PropTypes.bool,
};

MenuLink.defaultProps = {
  icon: null,
  inset: false,
  group: false,
};

export default MenuLink;
