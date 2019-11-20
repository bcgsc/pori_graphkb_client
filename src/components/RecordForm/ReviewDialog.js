import './index.scss';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import {
  Checkbox,
  Dialog, DialogContent, FormControlLabel, IconButton, Typography,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';
import React, {
  useCallback, useContext, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import { KBContext } from '@/components/KBContext';
import { getUser } from '@/services/auth';
import schema from '@/services/schema';

import FormField from './FormField';
import {
  FORM_VARIANT,
} from './util';


const MODEL_NAME = 'StatementReview';

/**
 * Form/View that displays the contents of a single node
 *
 * @property {function} props.onClose parent handler
 */
const AddReviewDialog = ({
  onSubmit, isOpen, onClose,
}) => {
  const snackbar = useContext(SnackbarContext);
  const context = useContext(KBContext);
  const { comment, status } = schema.get(MODEL_NAME).properties;

  const [updateAmalgamated, setUpdateAmalgamated] = useState(true);

  // handle and store the form content
  const {
    formContent, formErrors, formHasErrors, updateForm, formIsDirty, setFormIsDirty,
  } = useSchemaForm(
    { comment, status }, {},
  );

  /**
   * Handler for submission of a new record
   */
  const handleSubmit = useCallback(() => {
    if (formHasErrors) {
      // bring up the snackbar for errors
      setFormIsDirty(true);
      console.error(formErrors);
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
    } else {
      const content = { ...formContent, '@class': MODEL_NAME, createdBy: getUser(context) };
      onSubmit(content, updateAmalgamated);
    }
  }, [context, formContent, formErrors, formHasErrors, onSubmit, setFormIsDirty, snackbar, updateAmalgamated]);

  const handleOnChange = useCallback((event) => {
    // add the new value to the field
    const eventName = event.target.name || event.target.getAttribute('name'); // name of the form field triggering the event
    const eventValue = event.target.value;
    updateForm(eventName, eventValue);
  }, [updateForm]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      onEscapeKeyDown={onClose}
      maxWidth="lg"
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
          <FormField
            model={status}
            onChange={handleOnChange}
            value={formContent[status.name]}
            variant={FORM_VARIANT.NEW}
            error={formErrors[status.name]}
          />
          <FormField
            model={comment}
            onChange={handleOnChange}
            value={formContent[comment.name]}
            variant={FORM_VARIANT.NEW}
            error={formErrors[comment.name]}
            innerProps={{
              multiline: true,
              rows: 7,
              variant: 'outlined',
            }}
          />
          <FormControlLabel
            control={<Checkbox />}
            label="Also Update the Statement Amalgamated Review Status (Recommended)"
            checked={updateAmalgamated}
            onChange={() => setUpdateAmalgamated(!updateAmalgamated)}
            color="primary"
          />
        </DialogContent>
        <div className="review-dialog__action-button">
          <ActionButton
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            size="large"
            requireConfirm={false}
            disabled={formHasErrors && formIsDirty}
          >
              ADD REVIEW
          </ActionButton>
        </div>
      </div>
    </Dialog>
  );
};

AddReviewDialog.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
};

AddReviewDialog.defaultProps = {
  isOpen: false,
};

export default AddReviewDialog;
