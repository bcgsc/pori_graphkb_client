import PropTypes from 'prop-types';
import React from 'react';

import FormField from '@/components/FormField';
import schema from '@/services/schema';


/**
 * Renders the two edge specific input fields (out/in)
 *
 * @param {ClassModel} props.model the current edge model
 * @param {boolean} props.disabled flag to indicate these fields should be disabled
 */
const EdgeFields = ({
  model, disabled,
}) => (
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


EdgeFields.propTypes = {
  model: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

EdgeFields.defaultProps = {
  disabled: false,
};


export default EdgeFields;
