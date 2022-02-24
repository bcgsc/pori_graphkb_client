import './index.scss';

import {
  Checkbox,
  Dialog, DialogContent, FormControlLabel, IconButton, Typography,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';

import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/components/Auth';
import FormContext from '@/components/FormContext';
import FormField from '@/components/FormField';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import {
  FORM_VARIANT,
} from '@/components/util';
import schema from '@/services/schema';

const MODEL_NAME = 'StatementReview';

interface AddReviewDialogProps {
  onClose: () => void;
  onSubmit: (content: object, updateAmalgamated: boolean) => void;
  isOpen?: boolean;
}

/**
 * Form/View that displays the contents of a single node
 *
 * @property {function} props.onClose parent handler
 */
function AddReviewDialog(props: AddReviewDialogProps) {
  const {
    onSubmit,
    isOpen = false,
    onClose,
  } = props;
  const snackbar = useSnackbar();
  const auth = useAuth();
  const { comment, status } = schema.get(MODEL_NAME).properties;

  const [updateAmalgamated, setUpdateAmalgamated] = useState(true);

  // handle and store the form content
  const form = useSchemaForm({ comment, status }, {}, { variant: FORM_VARIANT.NEW });
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
      const content = { ...formContent, '@class': MODEL_NAME, createdBy: auth.user };
      onSubmit(content, updateAmalgamated);
    }
  }, [auth, formContent, formErrors, formHasErrors, onSubmit, setFormIsDirty, snackbar, updateAmalgamated]);

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
}

AddReviewDialog.defaultProps = {
  isOpen: false,
};

export default AddReviewDialog;
