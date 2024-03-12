import './index.scss';

import React, {
  ReactNode,
  useCallback,
} from 'react';
import {
  useLocation, useNavigate, useParams, useSearchParams,
} from 'react-router-dom';

import RecordForm from '@/components/RecordForm';
import StatementForm from '@/components/StatementForm';
import { FORM_VARIANT } from '@/components/util';
import NewVariant from '@/components/VariantForm';
import schema from '@/services/schema';
import util from '@/services/util';

const VARIANT_CLASSES = ['variant', 'positionalvariant', 'categoryvariant'];

const NewRecordView = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { modelName } = useParams<{ modelName: string }>();
  /**
   * After the form is submitted/completed. Handle the corresponding redirect
   */
  const handleSubmit = useCallback((result = null) => {
    if (result) {
      navigate(schema.getLink(result));
    } else {
      navigate('/');
    }
  }, [navigate]);

  /**
   * Handles the redirect if an error occurs in the child component
   */
  const handleError = useCallback(({ error = {} }) => {
    const { name } = error;
    const massagedMsg = util.massageRecordExistsError(error);
    util.handleErrorSaveLocation({ name, message: massagedMsg }, { navigate, pathname, search: searchParams.toString() });
  }, [navigate, pathname, searchParams]);

  let innerComponent: ReactNode = null;

  if (!modelName) {
    navigate('/', { replace: true });
    return null;
  }

  if (
    VARIANT_CLASSES.includes(modelName.toLowerCase())
    || (modelName && VARIANT_CLASSES.includes(modelName.toLowerCase()))
  ) {
    innerComponent = (
      <NewVariant
        onError={handleError}
        onSubmit={handleSubmit}
      />
    );
  } else if (modelName.toLowerCase() === 'statement') {
    innerComponent = (
      <StatementForm
        onError={handleError}
        onSubmit={handleSubmit}
        title="Create a new Statement Record"
        variant={FORM_VARIANT.NEW}
      />
    );
  } else {
    innerComponent = (
      <RecordForm
        modelName={modelName}
        onError={handleError}
        onSubmit={handleSubmit}
        title={`Create a new ${modelName} Record`}
        variant={FORM_VARIANT.NEW}
      />
    );
  }
  return (
    <div className="new-record-view">{innerComponent}</div>
  );
};

export default NewRecordView;
