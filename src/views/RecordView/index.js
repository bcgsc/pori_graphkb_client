import React, {
  useContext, useState, useCallback, useEffect,
} from 'react';
import * as qs from 'qs';
import {
  CircularProgress,
} from '@material-ui/core';
import useDeepCompareEffect from 'use-deep-compare-effect';
import propTypes from 'prop-types';

import RecordForm from '../../components/RecordForm';
import { KBContext } from '../../components/KBContext';
import { FORM_VARIANT } from '../../components/RecordForm/util';
import { cleanLinkedRecords } from '../../components/util';
import { hasWriteAccess } from '../../services/auth';
import api from '../../services/api';
import { HistoryPropType } from '../../components/Types';


const DEFAULT_TITLES = {
  [FORM_VARIANT.EDIT]: 'Edit this Record',
  [FORM_VARIANT.VIEW]: 'Record Contents',
};


const getModelFromName = (schema, path = '', modelName = '', variant = FORM_VARIANT.VIEW) => {
  let defaultModelName = modelName;

  if (modelName) {
    const model = schema.getModel(modelName);
    defaultModelName = model.name;

    if (!model || (model.isAbstract && variant === FORM_VARIANT.EDIT)) {
      throw new Error(`Page Not Found. '${modelName}' is not a valid model`);
    }
  } else if (path.includes('/user/')) {
    defaultModelName = 'User';
  } else if (path.includes('/usergroup/')) {
    defaultModelName = 'UserGroup';
  } else if (path.includes('/e/')) {
    defaultModelName = 'E';
  }
  return schema.getModel(defaultModelName || 'V').name;
};


const RecordView = (props) => {
  const { history, match: { path, params: { rid, modelName: modelNameParam, variant } } } = props;
  const context = useContext(KBContext);
  const { schema } = context;

  const [recordContent, setRecordContent] = useState({});
  const [modelName, setModelName] = useState('');

  useEffect(() => {
    if (schema && path) {
      try {
        const name = getModelFromName(schema, path, modelNameParam, variant);
        setModelName(name);
      } catch (err) {
        history.push('/error', { error: { name: err.name, message: err.toString() } });
      }
    }
  }, [path, modelNameParam, variant, schema, history]);


  /**
   * After the form is submitted/completed. Handle the corresponding redirect
   */
  const handleSubmit = useCallback((result = null) => {
    if (result && (variant === FORM_VARIANT.NEW || variant === FORM_VARIANT.EDIT)) {
      history.push(schema.getLink(result));
    } else if (result && variant === FORM_VARIANT.SEARCH) {
      // redirect to the data view page
      const search = qs.stringify(cleanLinkedRecords(result));
      history.push(`/data/table?${search}`, { search, content: result });
    } else {
      history.push('/');
    }
  }, [history, schema, variant]);

  /**
   * Handles the redirect if an error occurs in the child component
   */
  const handleError = useCallback(({ error = {}, content = null }) => {
    const { name, message } = error;

    if (name === 'RecordExistsError' && content) {
      // redirect to the data view page
      const search = qs.stringify(cleanLinkedRecords(content));
      history.push(`/data/table?${search}`, { search, content });
    } else {
      history.push('/error', { error: { name, message } });
    }
  }, [history]);

  // fetch the record from the rid if given
  useDeepCompareEffect(() => {
    let call = null;

    const fetchRecord = async () => {
      const { '@class': defaultModel } = recordContent;
      const model = schema.get(modelName || 'V');

      if (!model) {
        handleError({ error: { name: 'ModelNotFound', message: `Unable to find model for ${modelName || defaultModel}` } });
      } else if (variant !== FORM_VARIANT.NEW && variant !== FORM_VARIANT.SEARCH && rid) {
        // If not a new form then should have existing content
        try {
          call = api.get(`${model.routeName}/${rid.replace(/^#/, '')}?neighbors=3`, { forceListReturn: true });
          const result = await call.request();

          if (result && result.length) {
            setRecordContent({ ...result[0] });
            setModelName(result[0]['@class']);
          } else {
            handleError({ error: { name: 'RecordNotFound', message: `Unable to retrieve record details for ${model.routeName}/${rid}` } });
          }
        } catch (err) {
          handleError({ error: err });
        }
      }
    };
    fetchRecord();
    return () => call && call.abort();
    // must not update on modelName since this sets modelName
  }, [rid, modelNameParam, schema, path, recordContent, variant, handleError]); // eslint-disable-line


  // redirect when the user clicks the top right button
  const onTopClick = useCallback(() => {
    const model = schema.get(modelName);
    const newVariant = variant === FORM_VARIANT.EDIT
      ? FORM_VARIANT.VIEW
      : FORM_VARIANT.EDIT;
    const newPath = `/${newVariant}/${model.name}/${rid}`;
    history.push(newPath);
  }, [history, modelName, rid, schema, variant]);

  return (
    schema && modelName
      ? (
        <RecordForm
          variant={variant}
          modelName={modelName}
          rid={rid}
          value={recordContent}
          title={DEFAULT_TITLES[variant].replace(':modelName', modelName)}
          onTopClick={
            hasWriteAccess(context)
              ? onTopClick
              : null
          }
          onSubmit={handleSubmit}
          onError={handleError}
        />
      )
      : (<CircularProgress />)
  );
};

RecordView.propTypes = {
  history: HistoryPropType.isRequired,
  match: propTypes.shape({
    path: propTypes.string,
    params: propTypes.shape({
      rid: propTypes.string,
      modelName: propTypes.string,
      variant: propTypes.string,
    }),
  }).isRequired,
};


export default RecordView;
