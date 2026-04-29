import './index.scss';

import CancelIcon from '@mui/icons-material/Cancel';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import React from 'react';

import RecordForm from '@/components/RecordForm';
import { FORM_VARIANT } from '@/components/util';

interface RecordFormDialogProps extends Omit<React.ComponentProps<typeof RecordForm>, 'title'> {
  /** the function to handle the dialog cancel button */
  onClose: (...args: unknown[]) => void;
  /** flag to indicate the current dialog is open */
  isOpen?: boolean;
  title?: string;
}

/**
 * Popup container for holding a RecordForm component
 */
const RecordFormDialog = (props: RecordFormDialogProps) => {
  const {
    isOpen = false,
    modelName,
    onClose,
    onSubmit,
    title = '',
    variant,
    value,
    onToggleState,
  } = props;

  const defaultTitle = variant === FORM_VARIANT.NEW
    ? `Add a new ${modelName}`
    : `Edit an Existing ${modelName}`;

  return (
    <Dialog
      classes={{
        paper: 'record-form-dialog',
      }}
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={isOpen}
      TransitionProps={{ unmountOnExit: true }}
    >
      <div className="record-form-dialog__header">
        <DialogTitle>
          {title || defaultTitle}
        </DialogTitle>
        <DialogActions>
          <IconButton onClick={onClose}>
            <CancelIcon />
          </IconButton>
        </DialogActions>
      </div>
      <DialogContent>
        <RecordForm
          modelName={modelName}
          onSubmit={onSubmit}
          onToggleState={onToggleState}
          title={title}
          value={value}
          variant={variant}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RecordFormDialog;
