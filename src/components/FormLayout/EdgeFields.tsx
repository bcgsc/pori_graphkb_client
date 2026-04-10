import { ClassDefinition } from '@bcgsc-pori/graphkb-schema';
import React from 'react';

import FormField from '@/components/FormField';

interface EdgeFieldsProps {
  /**
   * the current edge model
   */
  model: ClassDefinition;
  /** flag to indicate these fields should be disabled */
  disabled?: boolean;
}

/**
 * Renders the two edge specific input fields (out/in)
 */
const EdgeFields = ({
  model, disabled = false,
}: EdgeFieldsProps) => (
  <React.Fragment key="relationship-content">
    <FormField
      disabled={disabled}
      label="Source Record (out)"
      model={{
        description: 'The source record for the relationship',
        linkedClass: model.sourceModel || 'V',
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
        linkedClass: model.targetModel || 'V', // TODO same but targetModel
        description: 'The target record for the relationship',
        name: 'in',
        type: 'link',
        mandatory: true,
        nullable: false,
      }}
    />
  </React.Fragment>
);

export default EdgeFields;
