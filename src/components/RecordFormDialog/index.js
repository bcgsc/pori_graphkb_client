import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';

import RecordForm from '../RecordForm';
import { FORM_VARIANT } from '../RecordForm/util';

import './index.scss';


/**
 * Popup container for holding a RecordForm component
 *
 * @param {object} props
 * @param {bool} props.isOpen flag to indicate the current dialog is open
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
    rid,
    title,
    variant,
    ...rest
  } = props;

  const defaultVariant = !rid
    ? FORM_VARIANT.NEW
    : FORM_VARIANT.EDIT;

  const defaultTitle = !rid
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
          variant={variant || defaultVariant}
          modelName={modelName}
          rid={rid}
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
  rid: PropTypes.string,
  variant: PropTypes.oneOf(Object.values(FORM_VARIANT)),
  title: PropTypes.string,
};

RecordFormDialog.defaultProps = {
  isOpen: false,
  rid: null,
  variant: null,
  title: ''
};


export default RecordFormDialog;
