import './index.scss';

import EditIcon from '@material-ui/icons/Create';
import GraphIcon from '@material-ui/icons/Timeline';
import ViewIcon from '@material-ui/icons/Visibility';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import ConfirmActionDialog from '@/components/ActionButton/ConfirmActionDialog';

/**
 * Toggle Button Navigation to switch between modes or settings.
 *
 * @property {object} props
 * @property {function} props.onClick parent handler function to toggle states
 * @property {bool} props.allowEdit if true, edit button is shown
 * @property {bool} props.requireConfirm flag to check whether confirmation is needed
 * @property {string} props.message message displayed in confirmation dialog
 * @property {string} props.value starting variant value
 */
function RecordFormStateToggle({
  onClick,
  requireConfirm,
  message,
  value: inputValue,
  allowEdit,
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
          data-testid="graph-view"
          value="graph"
        >
          <GraphIcon /><span className="toggle-option__text">Graph</span>
        </ToggleButton>
        <ToggleButton
          aria-label="view"
          value="view"
        >
          <ViewIcon /><span className="toggle-option__text">View</span>
        </ToggleButton>
        {allowEdit && (
          <ToggleButton
            aria-label="edit"
            value="edit"
          >
            <EditIcon /><span className="toggle-option__text">Edit</span>
          </ToggleButton>
        )}
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
  allowEdit: PropTypes.bool,
  message: PropTypes.string,
  onClick: PropTypes.func,
  requireConfirm: PropTypes.bool,
  value: PropTypes.oneOf(['view', 'edit', 'graph']),
};

RecordFormStateToggle.defaultProps = {
  onClick: () => {},
  allowEdit: false,
  requireConfirm: false,
  message: 'Are you sure?',
  value: 'view',
};

export default RecordFormStateToggle;
