import './index.scss';

import {
  Checkbox,
  Dialog, DialogContent, FormControlLabel, IconButton, Typography,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import React, {
  useCallback, useContext, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import FormContext from '@/components/FormContext';
import FormField from '@/components/FormField';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import { SecurityContext } from '@/components/SecurityContext';
import {
  FORM_VARIANT,
} from '@/components/util';
import { getUser } from '@/services/auth';
import schema from '@/services/schema';


const MODEL_NAME = 'StatementReview';

/**
 * Form/View that displays the contents of a single node
 *
 * @property {function} props.onClose parent handler
 */
const AddReviewDialog = ({
  onSubmit, isOpen, onClose,
}) => {
  const snackbar = useSnackbar();
  const context = useContext(SecurityContext);
  const { comment, status } = schema.get(MODEL_NAME).properties;

  const [updateAmalgamated, setUpdateAmalgamated] = useState(true);

  // handle and store the form content
  const form = useSchemaForm(
    { comment, status }, {}, { variant: FORM_VARIANT.NEW },
  );
  const {
    formContent, formErrors, formHasErrors, formIsDirty, setFormIsDirty,
  } = form;

  /**
   * Handler for submission of a new record
   */
  const handleSubmit = useCallback(() => {
    if (formHasErrors) {
      // bring up the snackbar for errors
      setFormIsDirty(true);
      console.error(formErrors);
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted', { variant: 'error' });
    } else {
      const content = { ...formContent, '@class': MODEL_NAME, createdBy: getUser(context) };
      onSubmit(content, updateAmalgamated);
    }
  }, [context, formContent, formErrors, formHasErrors, onSubmit, setFormIsDirty, snackbar, updateAmalgamated]);


  return (
    <Dialog
      maxWidth="lg"
      onClose={onClose}
      onEscapeKeyDown={onClose}
      open={isOpen}
    >
      <div className="review-dialog">
        <div className="review-dialog__header">
          <Typography variant="h2">Add a new Statement Review</Typography>
          <IconButton
            onClick={onClose}
          >
            <CancelIcon />
          </IconButton>
        </div>
        <DialogContent className="review-dialog__fields">
          <FormContext.Provider value={form}>
            <FormField
              model={status}
            />
            <FormField
              innerProps={{
                multiline: true,
                rows: 7,
                variant: 'outlined',
              }}
              model={comment}
            />
          </FormContext.Provider>
          <FormControlLabel
            checked={updateAmalgamated}
            color="primary"
            control={<Checkbox />}
            label="Also Update the Statement Amalgamated Review Status (Recommended)"
            onChange={() => setUpdateAmalgamated(!updateAmalgamated)}
          />
        </DialogContent>
        <div className="review-dialog__action-button">
          <ActionButton
            color="primary"
            disabled={formHasErrors && formIsDirty}
            onClick={handleSubmit}
            requireConfirm={false}
            size="large"
            variant="contained"
          >
            ADD REVIEW
          </ActionButton>
        </div>
      </div>
    </Dialog>
  );
};

AddReviewDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
};

AddReviewDialog.defaultProps = {
  isOpen: false,
};

export default AddReviewDialog;
