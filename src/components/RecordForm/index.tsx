import React from 'react';

import PositionalVariantForm from '../PositionalVariantForm';
import StatementForm from '../StatementForm';
import { FORM_VARIANT } from '../util';
import DefaultRecordForm, { RecordFormProps } from './DefaultRecordForm';

export default function RecordForm(props: Omit<RecordFormProps, 'title'>) {
  const {
    modelName, onSubmit, onToggleState, value, variant, open, formType, onClose,
  } = props;
  let title = 'Record Contents';

  if (variant === FORM_VARIANT.EDIT) {
    title = 'Edit this Record';
  } else if (variant === FORM_VARIANT.NEW) {
    title = `Create a new ${modelName} Record`;
  }

  let Form: React.ComponentType<RecordFormProps> = DefaultRecordForm;

  if (modelName === 'PositionalVariant') {
    Form = PositionalVariantForm;
  } else if (modelName === 'Statement') {
    Form = StatementForm;
  }

  return (
    <Form
      formType={formType}
      modelName={modelName}
      onClose={onClose}
      onSubmit={onSubmit}
      onToggleState={onToggleState}
      open={open}
      title={title}
      value={value}
      variant={variant}
    />
  );
}
