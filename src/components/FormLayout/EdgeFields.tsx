import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import React from 'react';

import FormField from '@/components/FormField';

interface EdgeFieldsProps {
  /**
   * the current edge model
   *
   * @todo get type from schema package
   */
  model: any;
  /** flag to indicate these fields should be disabled */
  disabled?: boolean;
}

/**
 * Renders the two edge specific input fields (out/in)
 */
const EdgeFields = ({
  model, disabled,
}: EdgeFieldsProps) => (
  <React.Fragment key="relationship-content">
    <FormField
      disabled={disabled}
      label="Source Record (out)"
      model={{
        description: 'The source record for the relationship',
        linkedClass: schemaDefn.get(model.sourceModel || 'V'), // TODO: check if models have sourceModel property now
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
        linkedClass: schemaDefn.get(model.targetModel || 'V'), // TODO same but targetModel
        description: 'The target record for the relationship',
        name: 'in',
        type: 'link',
        mandatory: true,
        nullable: false,
      }}
    />
  </React.Fragment>
);

EdgeFields.defaultProps = {
  disabled: false,
};

export default EdgeFields;
