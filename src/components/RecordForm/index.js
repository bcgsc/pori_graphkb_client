import React, {
  useEffect, useContext, useState, useReducer, useCallback,
} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import PropTypes from 'prop-types';
import {
  Paper, Typography, Button, CircularProgress,
} from '@material-ui/core';
import LocalLibraryIcon from '@material-ui/icons/LocalLibrary';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';

import api from '../../services/api';

import './index.scss';
import ActionButton from '../ActionButton';
import FormLayout from './FormLayout';
import {
  FORM_VARIANT,

} from './util';
import { KBContext } from '../KBContext';
import ReviewDialog from './ReviewDialog';
import ToggleButtonGroup from '../ToggleButtonGroup';


const cleanPayload = (payload) => {
  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }
  const newPayload = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && !/^(in|out)_\w+$/.exec(key)) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          newPayload[key] = value.map((arr) => {
            if (arr && arr['@rid']) {
              return arr['@rid'];
            }
            return cleanPayload(arr);
          });
        } else if (value['@rid']) {
          newPayload[key] = value['@rid'];
        } else {
          newPayload[key] = value;
        }
      } else {
        newPayload[key] = value;
      }
    }
  });
  return newPayload;
};


/**
 * Form/View that displays the contents of a single node
 *
 * @property {string} props.variant the type of NodeForm to create
 * @property {string} props.rid the record id of the current record for the form
 * @property {string} props.title the title for this form
 * @property {string} props.modelName name of class model to be displayed
 * @property {object} props.schema schema object defining class/prop models
 * @property {value} props.value values of individual properties of passed class model
 */
const RecordForm = ({
  value: initialValue,
  modelName,
  title,
  onTopClick,
  onSubmit,
  onError,
  variant,
  ...rest
}) => {
  const snackbar = useContext(SnackbarContext);
  const { schema } = useContext(KBContext);

  const [actionInProgress, setActionInProgress] = useState(false);
  const controllers = [];
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [formIsDirty, setFormIsDirty] = useState(false);

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
  }, initialValue || {});

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

  const formHasErrors = Object.values(formErrors).some(err => err);

  useEffect(() => () => controllers.map(c => c.abort()), []); // eslint-disable-line

  useDeepCompareEffect(() => {
    setFormFieldContent({ type: 'replace', payload: initialValue || {} });

    const initialErrors = {};
    Object.values(schema.get(modelName).properties).forEach((prop) => {
      const { error } = schema.validateValue(prop, (initialValue || {})[prop.name], false);

      if (error) {
        initialErrors[prop.name] = error;
      }
    });

    setFormFieldError({ type: 'replace', payload: initialErrors });
    setFormIsDirty(false);
  }, [initialValue]);

  /**
   * Handler for submission of a new record
   */
  const handleNewAction = useCallback(async () => {
    if (formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
      setFormIsDirty(true);
    } else {
      // ok to POST
      const content = { ...formContent };

      if (!formContent['@class']) {
        content['@class'] = modelName;
      }
      const payload = cleanPayload(content);
      const { routeName } = schema.get(payload);
      const call = api.post(routeName, payload);
      controllers.push(call);
      setActionInProgress(true);

      try {
        const result = await call.request();
        snackbar.add(`Sucessfully created the record ${result['@rid']}`);
        onSubmit(result);
      } catch (err) {
        console.error(err);
        snackbar.add(`Error (${err.name}) in creating the record`);
        onError({ error: err, content });
      }
      setActionInProgress(false);
    }
  }, [controllers, formContent, formErrors, formHasErrors, modelName, onError, onSubmit, schema, snackbar]);

  /**
   * Handler for deleting an existing record
   */
  const handleDeleteAction = useCallback(async () => {
    const content = { ...formContent };

    if (!formContent['@class']) {
      content['@class'] = modelName;
    }
    const { routeName } = schema.get(content);
    const call = api.delete(`${routeName}/${content['@rid'].replace(/^#/, '')}`);
    controllers.push(call);
    setActionInProgress(true);

    try {
      await call.request();
      snackbar.add(`Sucessfully deleted the record ${content['@rid']}`);
      onSubmit();
    } catch (err) {
      snackbar.add(`Error (${err.name}) in deleting the record (${content['@rid']})`);
      onError({ error: err, content });
    }
    setActionInProgress(false);
  }, [controllers, formContent, modelName, onError, onSubmit, schema, snackbar]);

  /**
   * Handler for edits to an existing record
   */
  const handleEditAction = useCallback(async () => {
    const content = { ...formContent };

    if (!formContent['@class']) {
      content['@class'] = modelName;
    }

    if (formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
      setFormIsDirty(true);
    } else if (!formIsDirty) {
      snackbar.add('no changes to submit');
      onSubmit(formContent);
    } else {
      const payload = cleanPayload(content);
      const { routeName } = schema.get(payload);
      const call = api.patch(`${routeName}/${content['@rid'].replace(/^#/, '')}`, payload);
      controllers.push(call);
      setActionInProgress(true);

      try {
        const result = await call.request();
        snackbar.add(`Sucessfully edited the record ${result['@rid']}`);
        onSubmit(result);
      } catch (err) {
        snackbar.add(`Error (${err.name}) in editing the record (${content['@rid']})`);
        onError({ error: err, content });
      }
      setActionInProgress(false);
    }
  }, [controllers, formContent, formErrors, formHasErrors, formIsDirty, modelName, onError, onSubmit, schema, snackbar]);

  const handleOnChange = (event) => {
    // add the new value to the field
    const eventName = event.target.name || event.target.getAttribute('name'); // name of the form field triggering the event
    const eventValue = event.target.value;

    const { properties: { [eventName]: prop } } = schema.get(modelName);
    const { value, error } = schema.validateValue(prop, eventValue, false);

    setFormFieldContent({ type: 'update', payload: { name: eventName, value } });
    setFormFieldError({ type: 'update', payload: { name: eventName, value: error } });
    setFormIsDirty(true);
  };

  const handleAddReview = useCallback((content, updateReviewStatus) => {
    // add the new value to the field
    const reviews = [...(formContent.reviews || []), content];
    setFormFieldContent({ type: 'update', payload: { name: 'reviews', value: reviews } });

    if (updateReviewStatus) {
      setFormFieldContent({ type: 'update', payload: { name: 'reviewStatus', value: content.status } });
    }
    setReviewDialogOpen(false);
  }, [formContent]);

  const isEdge = false; // TODO

  return (
    <Paper className="record-form__wrapper" elevation={4}>
      <div className="record-form__header">
        <Typography variant="h1" className="title">{title}</Typography>
        <div className="header-action-buttons">
          {(modelName === 'Statement' && variant === FORM_VARIANT.EDIT && (
          <Button
            onClick={() => setReviewDialogOpen(true)}
            variant="outlined"
            disabled={actionInProgress}
          >
            <LocalLibraryIcon
              classes={{ root: 'review-icon' }}
            />
            Add Review
          </Button>
          ))}
          {onTopClick && (variant === FORM_VARIANT.VIEW || variant === FORM_VARIANT.EDIT) && (
          <ToggleButtonGroup
            onClick={() => onTopClick(formContent)}
            requireConfirm
            options={['view', 'edit']}
            variant={variant}
            message="Are you sure? You will lose your changes."
          />
          )}
        </div>
        {(modelName === 'Statement' && variant === FORM_VARIANT.EDIT && (
        <ReviewDialog
          isOpen={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          onSubmit={handleAddReview}
        />
        ))}
      </div>
      <FormLayout
        {...rest}
        formIsDirty={formIsDirty}
        content={formContent}
        errors={formErrors}
        onChange={handleOnChange}
        modelName={modelName}
        variant={variant}
        collapseExtra
        disabled={actionInProgress || variant === FORM_VARIANT.VIEW}
      />
      {(
        <div className="record-form__action-buttons">
          {variant === FORM_VARIANT.EDIT
            ? (
              <ActionButton
                onClick={handleDeleteAction}
                variant="outlined"
                size="large"
                message="Are you sure you want to delete this record?"
                disabled={actionInProgress}
              >
                DELETE
              </ActionButton>
            )
            : (<div />) // for spacing issues only
          }
          {actionInProgress && (
            <CircularProgress size={50} />
          )}
          {variant === FORM_VARIANT.NEW || (variant === FORM_VARIANT.EDIT && !isEdge)
            ? (
              <ActionButton
                onClick={variant === FORM_VARIANT.EDIT
                  ? handleEditAction
                  : handleNewAction
                }
                variant="contained"
                color="primary"
                size="large"
                requireConfirm={false}
                disabled={actionInProgress || (formHasErrors && formIsDirty)}
              >
                {variant === FORM_VARIANT.EDIT
                  ? 'SUBMIT CHANGES'
                  : 'SUBMIT'
                }
              </ActionButton>
            )
            : (<div />) // for spacing issues only
          }
        </div>
      )}
    </Paper>
  );
};

RecordForm.propTypes = {
  modelName: PropTypes.string,
  onError: PropTypes.func,
  onSubmit: PropTypes.func,
  onTopClick: PropTypes.func,
  rid: PropTypes.string,
  title: PropTypes.string.isRequired,
  variant: PropTypes.string,
  value: PropTypes.object,
};

RecordForm.defaultProps = {
  modelName: null,
  onError: () => {},
  onSubmit: () => {},
  onTopClick: null,
  rid: null,
  variant: FORM_VARIANT.VIEW,
  value: {},
};

export default RecordForm;
