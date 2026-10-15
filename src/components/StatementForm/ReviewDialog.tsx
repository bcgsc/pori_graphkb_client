import './index.scss';

import CancelIcon from '@mui/icons-material/Cancel';
import {
  Checkbox,
  Dialog, DialogContent, FormControlLabel, IconButton, Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';

import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/components/Auth';
import FormField from '@/components/FormField';
import useSchemaForm, { FormContext } from '@/components/hooks/useSchemaForm';
import {
  FORM_VARIANT,
} from '@/components/util';
import schema from '@/services/schema';

const MODEL_NAME = 'StatementReview';
const { comment, status } = schema.get(MODEL_NAME).properties;

const model = {
  properties: { comment, status },
};

interface AddReviewDialogProps {
  /** parent handler */
  onClose: (...args: unknown[]) => void;
  onSubmit: (content: unknown, updateAmalgamated: boolean) => void;
  isOpen?: boolean;
}

/**
 * Form/View that displays the contents of a single node
 */
const AddReviewDialog = ({
  onSubmit, isOpen = false, onClose,
}: AddReviewDialogProps) => {
  const snackbar = useSnackbar();
  const auth = useAuth();

  const [updateAmalgamated, setUpdateAmalgamated] = useState(true);

  // handle and store the form content
  const form = useSchemaForm(model, undefined, { variant: FORM_VARIANT.NEW });
  const { setDirty: setFormIsDirty } = form;

  /**
   * Handler for submission of a new record
   */
  const handleSubmit = useCallback(() => {
    if (!form.validation.valid) {
      // bring up the snackbar for errors
      setFormIsDirty(true);
      console.error(form.validation);
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted', { variant: 'error' });
    } else {
      const content = { ...form.content, '@class': MODEL_NAME, createdBy: auth.user };
      onSubmit(content, updateAmalgamated);
    }
  }, [auth, form.content, form.validation, onSubmit, setFormIsDirty, snackbar, updateAmalgamated]);

  return (
    <Dialog
      maxWidth="lg"
      onClose={onClose}
      open={isOpen}
    >
      <div className="review-dialog">
        <div className="review-dialog__header">
          <Typography variant="h2">Add a new Statement Review</Typography>
          <IconButton onClick={onClose}>
            <CancelIcon />
          </IconButton>
        </div>
        <DialogContent className="review-dialog__fields">
          <FormContext.Provider value={form}>
            <FormField
              name="status"
            />
            <FormField
              innerProps={{
                multiline: true,
                rows: 7,
                variant: 'outlined',
              }}
              name="comment"
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
            disabled={!form.validation.valid && form.isDirty}
            onClick={handleSubmit}
            requireConfirm={false}
            variant="contained"
          >
            ADD REVIEW
          </ActionButton>
        </div>
      </div>
    </Dialog>
  );
};

export default AddReviewDialog;
