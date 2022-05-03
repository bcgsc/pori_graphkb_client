import './index.scss';

import EditIcon from '@material-ui/icons/Create';
import GraphIcon from '@material-ui/icons/Timeline';
import ViewIcon from '@material-ui/icons/Visibility';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import React, { useCallback, useEffect, useState } from 'react';

import ConfirmActionDialog from '@/components/ActionButton/ConfirmActionDialog';

import { FORM_VARIANT } from '../util';

interface RecordFormStateToggleProps {
  /** if true, edit button is shown */
  allowEdit?: boolean;
  /** message displayed in confirmation dialog */
  message?: string;
  /** parent handler function to toggle states */
  onClick?: (nextState: FORM_VARIANT | 'graph') => void;
  /** flag to check whether confirmation is needed */
  requireConfirm?: boolean;
  /** starting variant value */
  value?: FORM_VARIANT | 'graph';
}

/**
 * Toggle Button Navigation to switch between modes or settings.
 */
function RecordFormStateToggle({
  onClick,
  requireConfirm,
  message = 'Are you sure?',
  value: inputValue,
  allowEdit,
}: RecordFormStateToggleProps) {
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

RecordFormStateToggle.defaultProps = {
  onClick: () => {},
  allowEdit: false,
  requireConfirm: false,
  message: 'Are you sure?',
  value: FORM_VARIANT.VIEW,
};

export default RecordFormStateToggle;
