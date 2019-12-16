import './index.scss';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import {
  Button, CircularProgress,
  IconButton,
  Paper, Tooltip, Typography,
} from '@material-ui/core';
import LocalLibraryIcon from '@material-ui/icons/LocalLibrary';
import TimelineIcon from '@material-ui/icons/Timeline';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useContext, useEffect, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import KbContext from '@/components/KBContext';
import ToggleButtonGroup from '@/components/ToggleButtonGroup';
import { GeneralRecordPropType } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import { getUser } from '@/services/auth';
import schema from '@/services/schema';

import EdgeTable from './EdgeTable';
import FormLayout from './FormLayout';
import ReviewDialog from './ReviewDialog';

const FIELD_EXCLUSIONS = ['groupRestrictions'];

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
 * @property {value} props.value values of individual properties of passed class model
 * @property {function} props.navigateToGraph redirects to graph view with current record as initial node
 */
const RecordForm = ({
  value: initialValue,
  modelName,
  title,
  onTopClick,
  onSubmit,
  onError,
  variant,
  navigateToGraph,
  ...rest
}) => {
  const snackbar = useContext(SnackbarContext);
  const kbContext = useContext(KbContext);

  const [actionInProgress, setActionInProgress] = useState(false);
  const controllers = [];
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const [fieldDefs, setFieldDefs] = useState({});

  useEffect(() => {
    if (modelName) {
      const { properties } = schema.get(modelName);
      setFieldDefs(properties);
    }
  }, [modelName]);

  const {
    formIsDirty, setFormIsDirty, formContent, formErrors, updateForm, formHasErrors,
  } = useSchemaForm(fieldDefs, initialValue);

  useEffect(() => () => controllers.map(c => c.abort()), []); // eslint-disable-line

  const statementReviewCheck = useCallback((currContent, content) => {
    const updatedContent = { ...content };

    if (!currContent.reviewStatus) {
      updatedContent.reviewStatus = 'initial';
    }

    if (!currContent.reviews) {
      const createdBy = getUser(kbContext);
      updatedContent.reviews = [{
        status: 'initial',
        comment: '',
        createdBy,
      }];
    }

    return updatedContent;
  }, [kbContext]);

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
      let content = { ...formContent };

      if (!formContent['@class']) {
        content['@class'] = modelName;
      }

      if (modelName === 'Statement') {
        content = statementReviewCheck(formContent, content);
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
  }, [controllers, formContent, formErrors, formHasErrors, modelName, onError, onSubmit, setFormIsDirty, snackbar, statementReviewCheck]);

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
  }, [controllers, formContent, modelName, onError, onSubmit, snackbar]);

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
  }, [controllers, formContent, formErrors, formHasErrors, formIsDirty, modelName, onError, onSubmit, setFormIsDirty, snackbar]);

  const handleOnChange = (event) => {
    // add the new value to the field
    const eventName = event.target.name || event.target.getAttribute('name'); // name of the form field triggering the event
    const eventValue = event.target.value;

    updateForm(eventName, eventValue);
    setFormIsDirty(true);
  };

  const handleAddReview = useCallback((content, updateReviewStatus) => {
    // add the new value to the field
    const reviews = [...(formContent.reviews || []), content];
    updateForm('reviews', reviews);

    if (updateReviewStatus) {
      updateForm('reviewStatus', content.status);
    }
    setReviewDialogOpen(false);
    setFormIsDirty(true);
  }, [formContent.reviews, setFormIsDirty, updateForm]);

  const isEdge = false; // TODO

  return (
    <Paper className="record-form__wrapper" elevation={4}>
      <div className="record-form__header">
        <Typography className="title" variant="h1">{title}</Typography>
        <div className="header-action-buttons">
          {(modelName === 'Statement' && variant === FORM_VARIANT.EDIT && (
          <Button
            disabled={actionInProgress}
            onClick={() => setReviewDialogOpen(true)}
            variant="outlined"
          >
            <LocalLibraryIcon
              classes={{ root: 'review-icon' }}
            />
            Add Review
          </Button>
          ))}
          {variant === FORM_VARIANT.VIEW && (
            <div className="header-action-buttons__graphview">
              <Tooltip title="click here for graphview">
                <IconButton
                  data-testid="graph-view"
                  onClick={navigateToGraph}
                >
                  <TimelineIcon
                    color="secondary"
                  />
                </IconButton>
              </Tooltip>
            </div>
          )}
          {onTopClick && (variant === FORM_VARIANT.VIEW || variant === FORM_VARIANT.EDIT) && (
          <ToggleButtonGroup
            message="Are you sure? You will lose your changes."
            onClick={() => onTopClick(formContent)}
            options={['view', 'edit']}
            requireConfirm
            variant={variant}
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
        collapseExtra
        content={formContent}
        disabled={actionInProgress || variant === FORM_VARIANT.VIEW}
        errors={formErrors}
        exclusions={FIELD_EXCLUSIONS}
        formIsDirty={formIsDirty}
        modelName={modelName}
        onChange={handleOnChange}
        variant={variant}
      />
      {variant === FORM_VARIANT.VIEW && (
        <div className="record-form__related-records">
          <Typography variant="h4">Related Records</Typography>
          <EdgeTable value={formContent} />
        </div>
      )}
      <div className="record-form__action-buttons">
        {variant === FORM_VARIANT.EDIT
          ? (
            <ActionButton
              disabled={actionInProgress}
              message="Are you sure you want to delete this record?"
              onClick={handleDeleteAction}
              size="large"
              variant="outlined"
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
              color="primary"
              disabled={actionInProgress || (formHasErrors && formIsDirty)}
              onClick={variant === FORM_VARIANT.EDIT
                ? handleEditAction
                : handleNewAction
                }
              requireConfirm={false}
              size="large"
              variant="contained"
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
    </Paper>
  );
};


RecordForm.propTypes = {
  navigateToGraph: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  modelName: PropTypes.string,
  onError: PropTypes.func,
  onSubmit: PropTypes.func,
  onTopClick: PropTypes.func,
  rid: PropTypes.string,
  value: GeneralRecordPropType,
  variant: PropTypes.string,
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
