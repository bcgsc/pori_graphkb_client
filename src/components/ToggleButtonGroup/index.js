import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Create';
import ViewIcon from '@material-ui/icons/Pageview';
import utils from '../../services/util';

import ConfirmActionDialog from '../ActionButton/ConfirmActionDialog';
import './index.scss';

/**
 * Toggle Button Navigation to switch between modes or settings.
 *
 * @property {object} props
 * @property {arrayOf<strings>} props.options array of string values
 * @property {function} props.onClick parent handler function to toggle states
 * @property {bool} props.requireConfirm flag to check whether confirmation is needed
 * @property {string} props.message message displayed in confirmation dialog
 * @property {arrayOf<icons>} props.icons optional icon set for Navigation
 * @property {string} props.variant starting variant value
 */
function ToggleButtonGroup(props) {
  const {
    options,
    onClick,
    requireConfirm,
    message,
    icons,
    variant,
  } = props;

  const [value, setValue] = useState(variant);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setValue(variant);
  }, [variant]);

  const handleDialogCancel = () => {
    setDialogOpen(false);
  };

  const handleDialogConfirm = () => {
    setDialogOpen(false);
    setValue(options[0]);
    onClick();
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleChange = (newValue) => {
    if (value !== newValue) {
      if (newValue === options[0] && newValue !== value && requireConfirm) {
        handleOpenDialog();
      } else {
        setValue(newValue);
        onClick();
      }
    }
  };

  const toggleButtons = options.map((option, index) => (
    <button type="button" className="toggle-button" onClick={() => handleChange(option)}>
      <span className={`toggle-button__wrapper${value === option ? '--selected' : ''}`}>
        {icons[index]}
        <span className={`toggle-button__label${value === option ? '--selected' : ''}`}>{utils.antiCamelCase(option)}</span>
      </span>
    </button>
  ));

  return (
    <>
      <div className="container">
        {toggleButtons}
      </div>
      {requireConfirm && (
      <ConfirmActionDialog
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
        isOpen={dialogOpen}
        message={message}
        className="action-button__dialog"
      />
      )}
    </>
  );
}

ToggleButtonGroup.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClick: PropTypes.func,
  requireConfirm: PropTypes.bool,
  message: PropTypes.string,
  icons: PropTypes.array,
  variant: PropTypes.string,
};

ToggleButtonGroup.defaultProps = {
  onClick: () => {},
  requireConfirm: false,
  message: 'Are you sure?',
  icons: [<ViewIcon />, <EditIcon />],
  variant: 'view',
};

export default ToggleButtonGroup;
