import './index.scss';

import {
  CircularProgress,
  Paper, Typography,
} from '@material-ui/core';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import React, {
  useCallback, useEffect, useRef,
  useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import FormContext from '@/components/FormContext';
import FormLayout from '@/components/FormLayout';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { GeneralRecordPropType } from '@/components/types';
import { cleanPayload, FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';

import EdgeTable from './EdgeTable';
import RelatedStatementsTable from './RelatedStatementsTable';
import RelatedVariantsTable from './RelatedVariantsTable';

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
  const snackbar = useSnackbar();

  const [actionInProgress, setActionInProgress] = useState(false);
  const controllers = useRef([]);
  const [isEdge, setIsEdge] = useState(false);

  const [fieldDefs, setFieldDefs] = useState({});

  useEffect(() => {
    if (modelName) {
      const { properties } = schema.get(modelName);
      setFieldDefs(properties);
      setIsEdge(schema.isEdge(modelName));
    }
  }, [modelName]);

  const form = useSchemaForm(fieldDefs, initialValue, { variant });
  const {
    formIsDirty, setFormIsDirty, formContent, formErrors, formHasErrors,
  } = form;

  useEffect(() => () => controllers.current.map(c => c.abort()), []);

  /**
   * Handler for submission of a new record
   */
  const handleNewAction = useCallback(async () => {
    if (formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted');
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
      controllers.current.push(call);
      setActionInProgress(true);

      try {
        const result = await call.request();
        snackbar.enqueueSnackbar(`Sucessfully created the record ${result['@rid']}`);
        onSubmit(result);
      } catch (err) {
        console.error(err);
        snackbar.enqueueSnackbar(`Error (${err.name}) in creating the record`);
        onError({ error: err, content });
      }
      setActionInProgress(false);
    }
  }, [formContent, formErrors, formHasErrors, modelName, onError, onSubmit, setFormIsDirty, snackbar]);

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
    controllers.current.push(call);
    setActionInProgress(true);

    try {
      await call.request();
      snackbar.enqueueSnackbar(`Sucessfully deleted the record ${content['@rid']}`);
      onSubmit();
    } catch (err) {
      snackbar.enqueueSnackbar(`Error (${err.name}) in deleting the record (${content['@rid']})`);
      onError({ error: err, content });
    }
    setActionInProgress(false);
  }, [formContent, modelName, onError, onSubmit, snackbar]);

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
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted');
      setFormIsDirty(true);
    } else if (!formIsDirty) {
      snackbar.enqueueSnackbar('no changes to submit');
      onSubmit(formContent);
    } else {
      const payload = cleanPayload(content);
      const { routeName } = schema.get(payload);
      const call = api.patch(`${routeName}/${content['@rid'].replace(/^#/, '')}`, payload);
      controllers.current.push(call);
      setActionInProgress(true);

      try {
        const result = await call.request();
        snackbar.enqueueSnackbar(`Sucessfully edited the record ${result['@rid']}`);
        onSubmit(result);
      } catch (err) {
        snackbar.enqueueSnackbar(`Error (${err.name}) in editing the record (${content['@rid']})`);
        onError({ error: err, content });
      }
      setActionInProgress(false);
    }
  }, [formContent, formErrors, formHasErrors, formIsDirty, modelName, onError, onSubmit, setFormIsDirty, snackbar]);

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
    <Paper className="record-form__wrapper" elevation={4}>
      <div className="record-form__header">
        <span className="title">
          <Typography variant="h1">{pageTitle}</Typography>
          {title !== pageTitle && (<Typography variant="subtitle">{title}</Typography>)}
        </span>
        <div className={`header__actions header__actions--${variant}`}>
          {onTopClick && (variant === FORM_VARIANT.VIEW || variant === FORM_VARIANT.EDIT) && (
          <RecordFormStateToggle
            message="Are you sure? You will lose your changes."
            onClick={handleToggleState}
            requireConfirm={variant === 'edit' && formIsDirty}
            value={variant}
          />
          )}
        </div>
      </div>
      <FormContext.Provider value={form}>
        <FormLayout
          {...rest}
          collapseExtra
          disabled={actionInProgress || variant === FORM_VARIANT.VIEW || (variant === FORM_VARIANT.EDIT && isEdge)}
          exclusions={FIELD_EXCLUSIONS}
          modelName={modelName}
          variant={variant}
        />
      </FormContext.Provider>
      {variant === FORM_VARIANT.VIEW && schema.get(modelName).inherits.includes('V') && (
        <>
          <EdgeTable recordId={form.formContent['@rid']} />
          <RelatedStatementsTable recordId={form.formContent['@rid']} />
          {schema.get(modelName).inherits.includes('Ontology') && (
            <RelatedVariantsTable recordId={form.formContent['@rid']} />
          )}
        </>
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
