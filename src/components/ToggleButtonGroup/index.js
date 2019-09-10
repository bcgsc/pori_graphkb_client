import React, { useState } from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Create';
import ViewIcon from '@material-ui/icons/Camera';
import utils from '../../services/util';

import ConfirmActionDialog from '../ActionButton/ConfirmActionDialog';
import './index.scss';

function ToggleButtonGroup(props) {
  const {
    options, onClick, requireConfirm, message,
  } = props;
  const iconSet = [<ViewIcon />, <EditIcon />];
  const [value, setValue] = useState(options[0]);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    if (newValue === options[0] && requireConfirm) {
      handleOpenDialog();
    } else {
      setValue(newValue);
    }
  };

  const toggleButtons = options.map((option, index) => (
    <button type="button" className="button" onClick={() => handleChange(option)}>
      <span className={`button__wrapper${value === option ? '--selected' : ''}`}>
        {iconSet[index]}
        <span className={`button__label${value === option ? '--selected' : ''}`}>{utils.antiCamelCase(option)}</span>
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
};

ToggleButtonGroup.defaultProps = {
  onClick: () => {},
  requireConfirm: false,
  message: 'Are you sure?',
};

export default ToggleButtonGroup;
