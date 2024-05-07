import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  CircularProgress,
} from '@material-ui/core';
import { Buffer } from 'buffer';
import * as qs from 'qs';
import React, {
  useCallback, useEffect, useMemo,
  useState,
} from 'react';
import { useQuery } from 'react-query';
import {
  NavigateOptions,
  useLocation, useNavigate, useParams, useSearchParams,
} from 'react-router-dom';

import RecordForm from '@/components/RecordForm';
import StatementForm from '@/components/StatementForm';
import {
  cleanLinkedRecords, FORM_VARIANT, navigateToGraph, tuple,
} from '@/components/util';
import VariantForm from '@/components/VariantForm';
import api from '@/services/api';
import schema from '@/services/schema';
import util from '@/services/util';

window.Buffer = window.Buffer || Buffer;

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

type ModelNamesType = 'Source' | 'source' | 'User' | 'user' | 'UserGroup' | 'usergroup';

type RouteParams = {
  variant: FORM_VARIANT;
  modelName: ModelNamesType;
  rid: string;
};

const RecordView = ({
  modelName: modelNameParamProp,
  variant,
}: {
  modelName: ModelNamesType;
  variant: FORM_VARIANT;
}) => {
  const navigate = useNavigate();
  const {
    rid,
    modelName: modelNameParams,
  } = useParams<RouteParams>();

  // Use props over params
  const modelNameParam = modelNameParamProp ?? modelNameParams;

  const { pathname: path } = useLocation();
  const [searchParams] = useSearchParams();
  const [modelName, setModelName] = useState(modelNameParam || '');

  useEffect(() => {
    if (path) {
      try {
        const name = getModelFromName(path, modelNameParam, variant);
        setModelName(name);
      } catch (err) {
        if (err instanceof Error) {
          const error: NavigateOptions = { state: { error: { name: err.name, message: err.toString() } } };
          navigate('/error', error);
        } else {
          console.error(err);
        }
      }
    }
  }, [path, modelNameParam, variant, navigate]);

  /**
   * After the form is submitted/completed. Handle the corresponding redirect
   */
  const handleSubmit = useCallback((result = null) => {
    if (result && (variant === FORM_VARIANT.NEW || variant === FORM_VARIANT.EDIT)) {
      navigate(schema.getLink(result));
    } else if (result && variant === FORM_VARIANT.SEARCH) {
      // redirect to the data view page
      const search = qs.stringify(cleanLinkedRecords(result));
      navigate({
        pathname: '/data/table',
        search,
      }, { state: { content: result } });
    } else {
      navigate('/');
    }
  }, [navigate, variant]);

  /**
   * Handles the redirect if an error occurs in the child component
   */
  const handleError = useCallback(({ error = {} }) => {
    const { name } = error;
    const massagedMsg = util.massageRecordExistsError(error);
    util.handleErrorSaveLocation(
      { name, message: massagedMsg },
      { navigate, pathname: path, search: searchParams.toString() },
    );
  }, [navigate, path, searchParams]);

  const model = useMemo(() => schemaDefn.get(modelName || 'V'), [modelName]);

  const { data: recordContent } = useQuery(
    tuple(`${model?.routeName}/${rid?.replace(/^#/, '')}?neighbors=1`, { forceListReturn: true }),
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
    // Will give newState as null if user clicks same state (view/edit/graph)
    if (!newState) { return; }
    if (newState === 'graph') {
      navigateToGraph([recordContent['@rid']], navigate, handleError);
    } else {
      const newPath = `/${newState}/${model.name}/${rid}`;
      navigate(newPath);
    }
  }, [handleError, navigate, model.name, recordContent, rid]);

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
