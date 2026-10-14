import './index.scss';

import {
  CircularProgress,
} from '@mui/material';
import { Buffer } from 'buffer';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router';

import PositionalVariantForm from '@/components/PositionalVariantForm';
import RecordForm from '@/components/RecordForm';
import StatementForm from '@/components/StatementForm';
import { GeneralRecordType } from '@/components/types';
import { FORM_VARIANT, navigateToGraph, tuple } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';

window.Buffer = window.Buffer || Buffer;

const DEFAULT_TITLES = {
  [FORM_VARIANT.EDIT]: 'Edit this Record',
  [FORM_VARIANT.VIEW]: 'Record Contents',
};

const getModelFromName = (modelName: string | undefined, variant = FORM_VARIANT.VIEW) => {
  if (modelName) {
    const model = schema.get(modelName);

    if (!model || (model.isAbstract && variant === FORM_VARIANT.EDIT)) {
      throw new Error(`Page Not Found. '${modelName}' is not a valid model`);
    }
    return model;
  }
  return schema.get('V');
};

type RouteParams = {
  variant: FORM_VARIANT.EDIT | FORM_VARIANT.NEW | FORM_VARIANT.VIEW;
  modelName: string;
  rid: string;
};

const RecordView = ({
  modelName: modelNameParamProp,
  variant,
}: {
  modelName?: string;
  variant: FORM_VARIANT.EDIT | FORM_VARIANT.NEW | FORM_VARIANT.VIEW;
}) => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const {
    rid,
    modelName: modelNameParams,
  } = useParams<RouteParams>();

  // Use props over params
  const model = getModelFromName((modelNameParamProp ?? modelNameParams) || 'V');

  /**
   * After the form is submitted/completed. Handle the corresponding redirect
   */
  const handleSubmit = useCallback((result: GeneralRecordType | null = null) => {
    if (result && (variant === FORM_VARIANT.NEW || variant === FORM_VARIANT.EDIT)) {
      navigate(schema.getLink(result));
    } else {
      navigate('/');
    }
  }, [navigate, variant]);

  const { data: recordContent, isPending } = useQuery({
    queryKey: tuple(`${model.routeName}/${rid?.replace(/^#/, '')}?neighbors=1`, { forceListReturn: true, variant }),
    queryFn: async ({ queryKey: [route, options] }) => {
      const result = await api.get(route, options);

      return { ...result[0] };
    },
    enabled: Boolean(variant !== FORM_VARIANT.NEW && rid),
    refetchOnMount: 'always',
    throwOnError: true,
  });

  useEffect(() => {
    if (recordContent?.['@class'] && recordContent['@class'] !== model.name) {
      navigate(`/${variant}/${recordContent['@class']}/${rid}`);
    }
  }, [model.name, navigate, recordContent, rid, variant]);

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

  if (isPending && Boolean(variant !== FORM_VARIANT.NEW && rid)) {
    // wait for the content to load for existing records
    return (<CircularProgress />);
  }

  let Form = RecordForm;

  if (model.name === 'PositionalVariant') {
    Form = PositionalVariantForm;
  } else if (model.name === 'Statement') {
    Form = StatementForm;
  }
  return (
    <Form
      modelName={model.name}
      onSubmit={handleSubmit}
      onToggleState={handleToggleState}
      title={DEFAULT_TITLES[variant]}
      value={recordContent}
      variant={variant}
    />
  );
};

export default RecordView;
