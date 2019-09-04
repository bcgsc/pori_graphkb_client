import React, { useState } from 'react';
import Switch from '@material-ui/core/Switch';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';

import './index.scss';
import ConfirmActionDialog from '../ActionButton/ConfirmActionDialog';

/**
 * Switch to toggle between different modes and indicate current mode.
 *
 * @property {object} props
 * @property {bool} props.onClick parent onClick handler
 * @property {string} props.opt1 first option
 * @property {string} props.opt2 second option
 * @property {function} props.color primary color of switch
 */
function StyledSwitch(props) {
  const {
    onClick,
    requireConfirm,
    message,
    checked,
    opt1,
    opt2,
    color,
  } = props;

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDialogCancel = () => {
    setDialogOpen(false);
  };

  const handleDialogConfirm = () => {
    setDialogOpen(false);
    onClick();
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  return (
    <div className="toggle-switch">
      <Typography variant="h5">{opt1}</Typography>
      <Switch
        color={color}
        onClick={
          requireConfirm && checked
            ? handleOpenDialog
            : onClick
        }
        checked={checked}
        classes={{ switchBase: 'custom-switchBase' }}
      />
      <Typography variant="h5">{opt2}</Typography>
      {requireConfirm && (
        <ConfirmActionDialog
          onCancel={handleDialogCancel}
          onConfirm={handleDialogConfirm}
          isOpen={dialogOpen}
          message={message}
          className="action-button__dialog"
        />
      )}
    </div>
  );
}

StyledSwitch.propTypes = {
  onClick: PropTypes.func,
  checked: PropTypes.bool,
  opt1: PropTypes.string,
  opt2: PropTypes.string,
  color: PropTypes.string,
  requireConfirm: PropTypes.bool,
  message: PropTypes.string,
};

StyledSwitch.defaultProps = {
  onClick: () => {},
  checked: false,
  requireConfirm: false,
  opt1: 'OPTION1',
  opt2: 'OPTION2',
  color: 'primary',
  message: 'Are you sure?',
};

export default StyledSwitch;
