import './index.scss';

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import React from 'react';

import RecordForm from '@/components/RecordForm';
import { FORM_VARIANT } from '@/components/util';

interface RecordFormDialogProps extends Omit<React.ComponentProps<typeof RecordForm>, 'title'> {
  /** the function to handle the dialog cancel button */
  onClose: (...args: unknown[]) => void;
  /** flag to indicate the current dialog is open */
  isOpen?: boolean;
  title?: string;
  value?: React.ComponentProps<typeof RecordForm>['value'];
}

/**
 * Popup container for holding a RecordForm component
 */
function RecordFormDialog(props: RecordFormDialogProps) {
  const {
    isOpen = false,
    modelName,
    onClose,
    onError,
    onSubmit,
    title,
    variant,
    value = {},
    ...rest
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
          <IconButton
            onClick={onClose}
          >
            <CancelIcon />
          </IconButton>
        </DialogActions>
      </div>
      <DialogContent>
        <RecordForm
          {...rest}
          modelName={modelName}
          onError={onError}
          onSubmit={onSubmit}
          value={value}
          variant={variant}
        />
      </DialogContent>
    </Dialog>
  );
}

RecordFormDialog.defaultProps = {
  isOpen: false,
  value: {},
  title: '',
};

export default RecordFormDialog;
