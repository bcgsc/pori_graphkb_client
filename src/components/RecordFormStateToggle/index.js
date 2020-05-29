import './index.scss';

import EditIcon from '@material-ui/icons/Create';
import ViewIcon from '@material-ui/icons/Pageview';
import GraphIcon from '@material-ui/icons/Timeline';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import ConfirmActionDialog from '@/components/ActionButton/ConfirmActionDialog';

/**
 * Toggle Button Navigation to switch between modes or settings.
 *
 * @property {object} props
 * @property {function} props.onClick parent handler function to toggle states
 * @property {bool} props.requireConfirm flag to check whether confirmation is needed
 * @property {string} props.message message displayed in confirmation dialog
 * @property {string} props.value starting variant value
 */
function RecordFormStateToggle({
  onClick,
  requireConfirm,
  message,
  value: inputValue,
}) {
  const [value, setValue] = useState(inputValue);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setValue(inputValue);
  }, [inputValue]);

  const handleDialogCancel = () => {
    setDialogOpen(false);
  };

  const handleDialogConfirm = useCallback(() => {
    setDialogOpen(false);
    onClick(value);
  }, [onClick, value]);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleChange = useCallback((event, newValue) => {
    if (value !== newValue) {
      if (requireConfirm) {
        handleOpenDialog();
      } else {
        setValue(newValue);
        onClick(newValue);
      }
    }
  }, [onClick, requireConfirm, value]);


  return (
    <>
      <ToggleButtonGroup
        aria-label="form state toggle"
        className="record-form-state-toggle"
        exclusive
        onChange={handleChange}
        value={value}
      >
        <ToggleButton
          aria-label="graph"
          className="record-form-state-toggle__option toggle-option__graph"
          value="graph"
        >
          <GraphIcon /> Graph
        </ToggleButton>
        <ToggleButton
          aria-label="view"
          className="record-form-state-toggle__option"
          value="view"
        >
          <ViewIcon /> View
        </ToggleButton>
        <ToggleButton
          aria-label="edit"
          className="record-form-state-toggle__option"
          value="edit"
        >
          <EditIcon /> Edit
        </ToggleButton>
      </ToggleButtonGroup>
      {requireConfirm && (
      <ConfirmActionDialog
        className="action-button__dialog"
        isOpen={dialogOpen}
        message={message}
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
      />
      )}
    </>
  );
}

RecordFormStateToggle.propTypes = {
  message: PropTypes.string,
  onClick: PropTypes.func,
  requireConfirm: PropTypes.bool,
  value: PropTypes.oneOf(['view', 'edit', 'graph']),
};

RecordFormStateToggle.defaultProps = {
  onClick: () => {},
  requireConfirm: false,
  message: 'Are you sure?',
  value: 'view',
};

export default RecordFormStateToggle;
