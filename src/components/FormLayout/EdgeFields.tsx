import React from 'react';

import FormField from '@/components/FormField';
import schema from '@/services/schema';

interface EdgeFieldsProps {
  /** the current edge model */
  model: object;
  /** flag to indicate these fields should be disabled */
  disabled?: boolean;
}

/**
 * Renders the two edge specific input fields (out/in)
 */
function EdgeFields(props: EdgeFieldsProps) {
  const {
    model,
    disabled,
  } = props;
  return (
    <React.Fragment key="relationship-content">
      <FormField
        disabled={disabled}
        label="Source Record (out)"
        model={{
          description: 'The source record for the relationship',
          linkedClass: schema.get(model.sourceModel || 'V'),
          name: 'out',
          type: 'link',
          mandatory: true,
          nullable: false,
        }}
      />
      <FormField
        disabled={disabled}
        label="Target Record (in)"
        model={{
          linkedClass: schema.get(model.targetModel || 'V'),
          description: 'The target record for the relationship',
          name: 'in',
          type: 'link',
          mandatory: true,
          nullable: false,
        }}
      />
    </React.Fragment>
  );
}

EdgeFields.defaultProps = {
  disabled: false,
};

export default EdgeFields;
