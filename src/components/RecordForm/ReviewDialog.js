import React, {
  useContext, useReducer, useCallback, useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  IconButton, Typography, Dialog, DialogContent, FormControlLabel, Checkbox,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';

import { getUser } from '../../services/auth';

import './index.scss';
import ActionButton from '../ActionButton';
import {
  FORM_VARIANT,

} from './util';
import { KBContext } from '../KBContext';
import FormField from './FormField';


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
  const { schema } = context;
  const { comment, status } = schema.get(MODEL_NAME).properties;

  const [updateAmalgamated, setUpdateAmalgamated] = useState(true);

  // handle and store the form content
  const [formContent, setFormFieldContent] = useReducer((state, action) => {
    const { type: actionType, payload } = action;

    if (actionType === 'update') {
      const { name, value } = payload;
      return { ...state, [name]: value };
    } if (actionType === 'replace') {
      return { ...payload };
    }
    throw new Error(`actionType (${actionType}) not implemented`);
  }, {});

  // handle and store any errors reported from form field validators
  const [formErrors, setFormFieldError] = useReducer((state, action) => {
    const { type: actionType, payload } = action;

    if (actionType === 'update') {
      const { name, value } = payload;
      return { ...state, [name]: value };
    } if (actionType === 'replace') {
      return { ...payload };
    }
    throw new Error(`actionType (${actionType}) not implemented`);
  }, {});


  /**
   * Handler for submission of a new record
   */
  const handleSubmit = useCallback(() => {
    // check for missing required properties etc
    const errors = { ...formErrors };
    [comment, status].forEach((prop) => {
      const { error } = schema.validateValue(prop, formContent[prop.name], false);

      if (error) {
        errors[prop.name] = error;
      }
    });

    setFormFieldError({ type: 'replace', payload: errors });
    const formHasErrors = Object.values(errors).some(err => err);

    if (formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
    } else {
      const content = { ...formContent, '@class': MODEL_NAME, createdBy: getUser(context) };
      onSubmit(content, updateAmalgamated);
    }
  }, [comment, context, formContent, formErrors, onSubmit, schema, snackbar, status, updateAmalgamated]);

  const handleOnChange = (event) => {
    // add the new value to the field
    const eventName = event.target.name || event.target.getAttribute('name'); // name of the form field triggering the event
    const eventValue = event.target.value;

    const { properties: { [eventName]: prop } } = schema.get(MODEL_NAME);
    const { value, error } = schema.validateValue(prop, eventValue, false);

    setFormFieldContent({ type: 'update', payload: { name: eventName, value } });
    setFormFieldError({ type: 'update', payload: { name: eventName, value: error } });
  };

  const formHasErrors = Object.values(formErrors).some(err => err);

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
            label="Also Update the Statement Amalgamated Reivew Status (Recommended)"
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
            disabled={formHasErrors}
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
