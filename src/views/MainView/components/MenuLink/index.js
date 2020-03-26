import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Link,
} from 'react-router-dom';

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
  route, label, icon, inset, topLevel, onClick, activeLink,
}) => {
  const selected = (activeLink === route) && (!topLevel);

  return (
    <Link key={label.toLowerCase()} to={route}>
      <MenuItem onClick={() => { onClick(route, topLevel ? route : null); }}>
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

MenuLink.propTypes = {
  activeLink: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  route: PropTypes.string.isRequired,
  icon: PropTypes.object,
  inset: PropTypes.bool,
  topLevel: PropTypes.bool,
};

MenuLink.defaultProps = {
  icon: null,
  inset: false,
  topLevel: false,
};

export default MenuLink;
