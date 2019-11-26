import './index.scss';

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';
import React from 'react';

import RecordForm from '@/components/RecordForm';
import { FORM_VARIANT } from '@/components/RecordForm/util';


/**
 * Popup container for holding a RecordForm component
 *
 * @param {object} props
 * @param {bool} props.isOpen flag to indicate the current dialog is open
 * @param {Object} props.value initial value for the form
 * @param {string} props.modelName the model to use for the RecordForm
 * @param {func} props.onClose the function to handle the dialog cancel button
 * @param {func} props.onError the function handler for errors submitting the form
 * @param {func} props.onSubmit the function handler to be executing on sucessful form submission
 * @param {string} props.rid the initial record id
 */
const RecordFormDialog = (props) => {
  const {
    isOpen,
    modelName,
    onClose,
    onError,
    onSubmit,
    title,
    variant,
    value,
    ...rest
  } = props;

  const defaultTitle = variant === FORM_VARIANT.NEW
    ? `Add a new ${modelName}`
    : `Edit an Existing ${modelName}`;


  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      classes={{
        paper: 'record-form-dialog',
      }}
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
          variant={variant}
          modelName={modelName}
          value={value}
          onSubmit={onSubmit}
          onError={onError}
        />
      </DialogContent>
    </Dialog>
  );
};

RecordFormDialog.propTypes = {
  isOpen: PropTypes.bool,
  modelName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  value: PropTypes.object,
  variant: PropTypes.oneOf(Object.values(FORM_VARIANT)).isRequired,
  title: PropTypes.string,
};

RecordFormDialog.defaultProps = {
  isOpen: false,
  value: {},
  title: '',
};


export default RecordFormDialog;
