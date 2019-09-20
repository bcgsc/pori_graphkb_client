import React from 'react';
import PropTypes from 'prop-types';

import FormField from '../FormField';
import { FORM_VARIANT } from '../util';

/**
 * Renders the two edge specific input fields (out/in)
 */
const EdgeFields = ({
  schema, model, onChange, content, errors, disabled, variant,
}) => (
  <React.Fragment key="relationship-content">
    <FormField
      error={errors.out || ''}
      onChange={onChange}
      model={{
        description: 'The source record for the relationship',
        linkedClass: schema.get(model.sourceModel || 'V'),
        name: 'out',
        type: 'link',
        mandatory: true,
        nullable: false,
      }}
      schema={schema}
      value={content.out}
      disabled={disabled}
      variant={variant}
      label="Source Record (out)"
    />
    <FormField
      error={errors.in || ''}
      onChange={onChange}
      model={{
        linkedClass: schema.get(model.targetModel || 'V'),
        description: 'The target record for the relationship',
        name: 'in',
        type: 'link',
        mandatory: true,
        nullable: false,
      }}
      schema={schema}
      value={content.in}
      disabled={disabled}
      variant={variant}
      label="Target Record (in)"
    />
  </React.Fragment>
);


EdgeFields.propTypes = {
  model: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  content: PropTypes.object,
  errors: PropTypes.object,
  disabled: PropTypes.bool,
  schema: PropTypes.object.isRequired,
  variant: PropTypes.string,
};

EdgeFields.defaultProps = {
  content: {},
  errors: {},
  disabled: false,
  variant: FORM_VARIANT.VIEW,
};


export default EdgeFields;
