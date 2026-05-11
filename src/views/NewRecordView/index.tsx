import './index.scss';

import React, {
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { useNavigate, useParams } from 'react-router';

import RecordForm from '@/components/RecordForm';
import StatementForm from '@/components/StatementForm';
import { GeneralRecordType } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';
import NewVariant from '@/components/VariantForm';
import schema from '@/services/schema';

const VARIANT_CLASSES = ['variant', 'positionalvariant', 'categoryvariant'];

const NewRecordView = ({ modelName: propsModelName }: { modelName?: string }) => {
  const navigate = useNavigate();
  const { modelName: paramsModelName } = useParams<{ modelName: string }>();
  const modelName = propsModelName || paramsModelName;

  /**
   * After the form is submitted/completed. Handle the corresponding redirect
   */
  const handleSubmit = useCallback((result: GeneralRecordType | null = null) => {
    if (result) {
      navigate(schema.getLink(result));
    } else {
      navigate('/');
    }
  }, [navigate]);

  let innerComponent: ReactNode = null;

  useEffect(() => {
    if (!modelName) {
      navigate('/query', { replace: true });
    }
  }, [modelName, navigate]);

  if (!modelName) return null;

  if (
    VARIANT_CLASSES.includes(modelName.toLowerCase())
    || (modelName && VARIANT_CLASSES.includes(modelName.toLowerCase()))
  ) {
    innerComponent = (
      <NewVariant
        onSubmit={handleSubmit}
      />
    );
  } else if (modelName.toLowerCase() === 'statement') {
    innerComponent = (
      <StatementForm
        onSubmit={handleSubmit}
        title="Create a new Statement Record"
        variant={FORM_VARIANT.NEW}
      />
    );
  } else {
    innerComponent = (
      <RecordForm
        modelName={modelName}
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
