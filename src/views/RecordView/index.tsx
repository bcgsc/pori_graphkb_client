import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  CircularProgress,
} from '@material-ui/core';
import * as qs from 'qs';
import React, {
  useCallback, useEffect, useMemo,
  useState,
} from 'react';
import { useQuery } from 'react-query';
import { RouteComponentProps } from 'react-router-dom';

import RecordForm from '@/components/RecordForm';
import StatementForm from '@/components/StatementForm';
import {
  cleanLinkedRecords, FORM_VARIANT, navigateToGraph, tuple,
} from '@/components/util';
import VariantForm from '@/components/VariantForm';
import api from '@/services/api';
import schema from '@/services/schema';
import util from '@/services/util';

const DEFAULT_TITLES = {
  [FORM_VARIANT.EDIT]: 'Edit this Record',
  [FORM_VARIANT.VIEW]: 'Record Contents',
};

const getModelFromName = (path = '', modelName = '', variant = FORM_VARIANT.VIEW) => {
  let defaultModelName = modelName;

  if (modelName) {
    const model = schemaDefn.get(modelName) ?? schemaDefn.getFromRoute(modelName);
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
  return schemaDefn.get(defaultModelName || 'V').name;
};

const RecordView = (props: RouteComponentProps<{ rid: string; modelName: string; variant: FORM_VARIANT }>) => {
  const { history, match: { path, params: { rid, modelName: modelNameParam, variant } } } = props;

  const [modelName, setModelName] = useState(modelNameParam || '');

  useEffect(() => {
    if (path) {
      try {
        const name = getModelFromName(path, modelNameParam, variant);
        setModelName(name);
      } catch (err) {
        history.push('/error', { error: { name: err.name, message: err.toString() } });
      }
    }
  }, [path, modelNameParam, variant, history]);

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
  }, [history, variant]);

  /**
   * Handles the redirect if an error occurs in the child component
   */
  const handleError = useCallback(({ error = {} }) => {
    const { name } = error;
    const massagedMsg = util.massageRecordExistsError(error);
    util.handleErrorSaveLocation({ name, message: massagedMsg }, history);
  }, [history]);

  const model = useMemo(() => schemaDefn.get(modelName || 'V'), [modelName]);

  const { data: recordContent } = useQuery(
    tuple(`${model?.routeName}/${rid.replace(/^#/, '')}?neighbors=1`, { forceListReturn: true }),
    async ({ queryKey: [route, options] }) => {
      if (!model) {
        handleError({ error: { name: 'ModelNotFound', message: `Unable to find model for ${modelName}` } });
        return undefined;
      }
      const result = await api.get(route, options);

      if (result && result.length) {
        return { ...result[0] };
      }
      handleError({ error: { name: 'RecordNotFound', message: `Unable to retrieve record details for ${model.routeName}/${rid}` } });
      return undefined;
    },
    {
      enabled: Boolean(variant !== FORM_VARIANT.NEW && variant !== FORM_VARIANT.SEARCH && rid),
      onError: (err) => handleError({ error: err }),
      onSuccess: (result) => result && setModelName(result['@class']),
    },
  );

  // redirect when the user clicks the top right button
  const handleToggleState = useCallback((newState: FORM_VARIANT | 'graph') => {
    if (newState === 'graph') {
      navigateToGraph([recordContent['@rid']], history, handleError);
    } else {
      const newPath = `/${newState}/${model.name}/${rid}`;
      history.push(newPath);
    }
  }, [handleError, history, model.name, recordContent, rid]);

  if (!modelName || (variant !== FORM_VARIANT.NEW && (!recordContent || !recordContent['@rid']))) {
    // wait for the model to be set for new Records
    // wait for the content to load for existing records
    return (<CircularProgress />);
  }
  if (
    ['positionalvariant', 'categoryvariant', 'variant'].includes(modelName.toLowerCase())
    && variant === FORM_VARIANT.EDIT
  ) {
    return (
      <div className="edit-variant-view">
        <VariantForm
          formVariant={variant}
          onError={handleError}
          onSubmit={handleSubmit}
          value={recordContent}
        />
      </div>
    );
  }
  if (modelName.toLowerCase() === 'statement') {
    return (
      <StatementForm
        onError={handleError}
        onSubmit={handleSubmit}
        onToggleState={handleToggleState}
        rid={rid}
        title={DEFAULT_TITLES[variant].replace(':modelName', 'Statement')}
        value={recordContent}
        variant={variant}
      />
    );
  }
  return (
    <RecordForm
      modelName={modelName}
      onError={handleError}
      onSubmit={handleSubmit}
      onToggleState={handleToggleState}
      rid={rid}
      title={DEFAULT_TITLES[variant].replace(':modelName', modelName)}
      value={recordContent}
      variant={variant}
    />
  );
};

export default RecordView;
