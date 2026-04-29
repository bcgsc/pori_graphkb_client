import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  CircularProgress,
} from '@mui/material';
import { Buffer } from 'buffer';
import { useSnackbar } from 'notistack';
import * as qs from 'qs';
import React, {
  useCallback, useEffect, useMemo,
  useState,
} from 'react';
import { useQuery } from 'react-query';
import {
  useLocation, useNavigate, useParams,
} from 'react-router';

import RecordForm from '@/components/RecordForm';
import StatementForm from '@/components/StatementForm';
import { GeneralRecordType } from '@/components/types';
import {
  cleanLinkedRecords, FORM_VARIANT, navigateToGraph, tuple,
} from '@/components/util';
import VariantForm from '@/components/VariantForm';
import api from '@/services/api';
import schema from '@/services/schema';

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
  modelName?: ModelNamesType;
  variant: FORM_VARIANT;
}) => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const {
    rid,
    modelName: modelNameParams,
  } = useParams<RouteParams>();

  // Use props over params
  const modelNameParam = modelNameParamProp ?? modelNameParams;

  const { pathname: path } = useLocation();
  const [modelName, setModelName] = useState(modelNameParam || '');

  useEffect(() => {
    if (path) {
      const name = getModelFromName(path, modelNameParam, variant);
      setModelName(name as ModelNamesType);
    }
  }, [path, modelNameParam, variant, navigate]);

  /**
   * After the form is submitted/completed. Handle the corresponding redirect
   */
  const handleSubmit = useCallback((result: GeneralRecordType | null = null) => {
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

  const model = useMemo(() => schemaDefn.get(modelName || 'V'), [modelName]);

  const { data: recordContent } = useQuery({
    queryKey: tuple(`${model?.routeName}/${rid?.replace(/^#/, '')}?neighbors=1`, { forceListReturn: true, variant }),
    queryFn: async ({ queryKey: [route, options] }) => {
      const result = await api.get(route, options);

      return { ...result[0] };
    },
    enabled: Boolean(variant !== FORM_VARIANT.NEW && variant !== FORM_VARIANT.SEARCH && rid),
    refetchOnMount: 'always',
    throwOnError: true,
  });

  useEffect(() => {
    if (recordContent) {
      setModelName(recordContent['@class']);
    }
  }, [recordContent]);

  // redirect when the user clicks the top right button
  const handleToggleState = useCallback((newState: FORM_VARIANT | 'graph') => {
    // Will give newState as null if user clicks same state (view/edit/graph)
    if (!newState) { return; }
    if (newState === 'graph') {
      navigateToGraph([recordContent['@rid']], navigate, snackbar);
    } else {
      const newPath = `/${newState}/${model.name}/${rid}`;
      navigate(newPath);
    }
  }, [snackbar, navigate, model.name, recordContent, rid]);

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
          onSubmit={handleSubmit}
          value={recordContent}
        />
      </div>
    );
  }
  if (modelName.toLowerCase() === 'statement') {
    return (
      <StatementForm
        onSubmit={handleSubmit}
        onToggleState={handleToggleState}
        title={DEFAULT_TITLES[variant].replace(':modelName', 'Statement')}
        value={recordContent}
        variant={variant}
      />
    );
  }
  return (
    <RecordForm
      modelName={modelName}
      onSubmit={handleSubmit}
      onToggleState={handleToggleState}
      title={DEFAULT_TITLES[variant].replace(':modelName', modelName)}
      value={recordContent}
      variant={variant}
    />
  );
};

export default RecordView;
