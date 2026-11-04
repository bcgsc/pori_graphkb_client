import { Box, Paper } from '@mui/material';
import { Buffer } from 'buffer';
import { useSnackbar } from 'notistack';
import React, { useCallback } from 'react';
import { useLoaderData, useNavigate } from 'react-router';

import ModelSelect from '@/components/ModelSelect';
import RecordForm from '@/components/RecordForm';
import { GeneralRecordType } from '@/components/types';
import { FORM_VARIANT, navigateToGraph } from '@/components/util';
import schema from '@/services/schema';

import { createRecordLoader } from './loader';

window.Buffer = window.Buffer || Buffer;

const RecordView = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const {
    variant, modelName, rid, data: recordContent,
  } = useLoaderData<ReturnType<typeof createRecordLoader>>();

  // Use props over params
  const model = schema.get(modelName);

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

  if (model.isAbstract && variant === FORM_VARIANT.NEW) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper sx={{ maxWidth: 'md', width: '100%' }}>
          <ModelSelect
            baseModel={modelName}
            onChange={(e) => navigate(`/new/${e.target.value as string}`)}
            value=""
            variant="radio"
          />
        </Paper>
      </Box>
    );
  }

  return (
    <RecordForm
      modelName={model.name}
      onSubmit={handleSubmit}
      onToggleState={handleToggleState}
      value={recordContent}
      variant={variant}
    />
  );
};

export default RecordView;
