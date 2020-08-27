import './index.scss';

import { schema as schemaDefn } from '@bcgsc/knowledgebase-schema';
import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import {
  Button, CircularProgress,
  Paper, Typography,
} from '@material-ui/core';
import LocalLibraryIcon from '@material-ui/icons/LocalLibrary';
import PropTypes from 'prop-types';
import React, {
  useCallback, useContext, useEffect, useRef,
  useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import FormContext from '@/components/FormContext';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import FormLayout from '@/components/RecordForm/FormLayout';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { SecurityContext } from '@/components/SecurityContext';
import { GeneralRecordPropType } from '@/components/types';
import { cleanPayload, FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import { getUser } from '@/services/auth';
import schema from '@/services/schema';

import ReviewDialog from './ReviewDialog';

const FIELD_EXCLUSIONS = ['groupRestrictions'];

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
const StatementForm = ({
  value: initialValue,
  title,
  onTopClick,
  onSubmit,
  onError,
  variant,
  navigateToGraph,
  ...rest
}) => {
  const snackbar = useContext(SnackbarContext);
  const context = useContext(SecurityContext);
  const model = schemaDefn.schema.Statement;
  const fieldDefs = model.properties;

  const [actionInProgress, setActionInProgress] = useState(false);
  const controllers = useRef([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const form = useSchemaForm(fieldDefs, initialValue, { variant });
  const {
    formIsDirty, setFormIsDirty, formContent, formErrors, updateField, formHasErrors,
  } = form;

  useEffect(() => () => controllers.current.map(c => c.abort()), []);

  useEffect(() => {});

  const statementReviewCheck = useCallback((currContent, content) => {
    const updatedContent = { ...content };

    if (!currContent.reviewStatus) {
      updatedContent.reviewStatus = 'initial';
    }

    if (!currContent.reviews) {
      const createdBy = getUser(context);
      updatedContent.reviews = [{
        status: 'initial',
        comment: '',
        createdBy,
      }];
    }

    return updatedContent;
  }, [context]);

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
      let content = { ...formContent, '@class': model.name };
      content = statementReviewCheck(formContent, content);


      const payload = cleanPayload(content);
      const { routeName } = schema.get(payload);
      const call = api.post(routeName, payload);
      controllers.current.push(call);
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
  }, [formContent, formErrors, formHasErrors, model.name, onError, onSubmit, setFormIsDirty, snackbar, statementReviewCheck]);

  /**
   * Handler for deleting an existing record
   */
  const handleDeleteAction = useCallback(async () => {
    const content = { ...formContent, '@class': model.name };

    const { routeName } = schema.get(content);
    const call = api.delete(`${routeName}/${content['@rid'].replace(/^#/, '')}`);
    controllers.current.push(call);
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
  }, [formContent, model.name, onError, onSubmit, snackbar]);

  /**
   * Handler for edits to an existing record
   */
  const handleEditAction = useCallback(async () => {
    const content = { ...formContent, '@class': model.name };

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
      controllers.current.push(call);
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
  }, [formContent, formErrors, formHasErrors, formIsDirty, model.name, onError, onSubmit, setFormIsDirty, snackbar]);


  const handleAddReview = useCallback((content, updateReviewStatus) => {
    // add the new value to the field
    const reviews = [...(formContent.reviews || []), content];
    updateField('reviews', reviews);

    if (updateReviewStatus) {
      updateField('reviewStatus', content.status);
    }
    setReviewDialogOpen(false);
    setFormIsDirty(true);
  }, [formContent.reviews, setFormIsDirty, updateField]);

  const handleToggleState = useCallback((newState) => {
    if (newState !== variant) {
      if (newState === 'graph') {
        navigateToGraph();
      } else {
        onTopClick(formContent);
      }
    }
  }, [formContent, navigateToGraph, onTopClick, variant]);

  let pageTitle = title;

  if (variant === FORM_VARIANT.VIEW && formContent) {
    if (formContent.displayName) {
      pageTitle = `${formContent.displayName} (${formContent['@rid']})`;
    } else {
      pageTitle = `${formContent['@class']} ${formContent['@rid']}`;
    }
  }

  return (
    <Paper className="statement-form__wrapper" elevation={4}>
      <div className="statement-form__header">
        <span className="title">
          <Typography variant="h1">{pageTitle}</Typography>
          {title !== pageTitle && (<Typography variant="subtitle">{title}</Typography>)}
        </span>
        <div className={`header__actions header__actions--${variant}`}>
          {variant === FORM_VARIANT.EDIT && (
          <Button
            className="header__review-action"
            disabled={actionInProgress}
            onClick={() => setReviewDialogOpen(true)}
            variant="outlined"
          >
            <LocalLibraryIcon
              classes={{ root: 'review-icon' }}
            />
            Add Review
          </Button>
          )}
          {onTopClick && (variant === FORM_VARIANT.VIEW || variant === FORM_VARIANT.EDIT) && (
          <RecordFormStateToggle
            message="Are you sure? You will lose your changes."
            onClick={handleToggleState}
            requireConfirm={variant === 'edit' && formIsDirty}
            value={variant}
          />
          )}
        </div>
        {variant === FORM_VARIANT.EDIT && (
        <ReviewDialog
          isOpen={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          onSubmit={handleAddReview}
        />
        )}
      </div>
      <FormContext.Provider value={form}>
        <FormLayout
          {...rest}
          collapseExtra
          disabled={actionInProgress || variant === FORM_VARIANT.VIEW}
          exclusions={FIELD_EXCLUSIONS}
          modelName={model.name}
          variant={variant}
        />
      </FormContext.Provider>
      <div className="statement-form__action-buttons">
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
        {variant === FORM_VARIANT.NEW || variant === FORM_VARIANT.EDIT
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


StatementForm.propTypes = {
  navigateToGraph: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  onError: PropTypes.func,
  onSubmit: PropTypes.func,
  onTopClick: PropTypes.func,
  rid: PropTypes.string,
  value: GeneralRecordPropType,
  variant: PropTypes.string,
};

StatementForm.defaultProps = {
  onError: () => {},
  onSubmit: () => {},
  onTopClick: null,
  rid: null,
  variant: FORM_VARIANT.VIEW,
  value: {},
};

export default StatementForm;
