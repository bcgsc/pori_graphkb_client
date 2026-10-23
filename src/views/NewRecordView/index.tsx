import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';

import PositionalVariantForm from '@/components/PositionalVariantForm';
import RecordForm from '@/components/RecordForm';
import StatementForm from '@/components/StatementForm';
import { GeneralRecordType } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';
import schema from '@/services/schema';

const NewRecordView = ({ modelName: propsModelName }: { modelName?: string }) => {
  const navigate = useNavigate();
  const { modelName: paramsModelName } = useParams<{ modelName: string }>();
  const model = schema.get((propsModelName || paramsModelName)!);

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

  let Form = RecordForm;

  if (model.name === 'PositionalVariant') {
    Form = PositionalVariantForm;
  } else if (model.name === 'Statement') {
    Form = StatementForm;
  }
  return (
    <div className="new-record-view">
      <Form
        modelName={model.name}
        onSubmit={handleSubmit}
        title={`Create a new ${model.name} Record`}
        variant={FORM_VARIANT.NEW}
      />
    </div>
  );
};

export default NewRecordView;
