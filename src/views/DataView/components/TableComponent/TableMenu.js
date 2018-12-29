import React from 'react';
import PropTypes from 'prop-types';
import {
  Menu,
  MenuItem,
} from '@material-ui/core';

/**
 * Displays a list of actions to be performed on the table and its records.
 */
function TableMenu(props) {
  const {
    anchorEl,
    onClose,
    items,
  } = props;

  const withClose = (action) => {
    onClose();
    if (action) {
      action();
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
    >
      {
        items.map(item => (
          <MenuItem
            key={item.id || item.label}
            onClick={() => withClose(item.action)}
            id={item.id}
            disabled={item.disabled}
          >
            {item.label}
          </MenuItem>
        ))
      }
    </Menu>
  );
}

/**
 * @namespace
 * @property {any} anchorEl - Reference to the DOM node that the popover is
 * anchored to.
 * @property {Array} items - List of items to be displayed in menu.
 * @property {function} onClose - Handler for menu close.
 */
TableMenu.propTypes = {
  anchorEl: PropTypes.any,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.string,
    ]).isRequired,
    action: PropTypes.func,
    disabled: PropTypes.bool,
  })),
  onClose: PropTypes.func.isRequired,
};

TableMenu.defaultProps = {
  anchorEl: null,
  items: [],
};

export default TableMenu;
