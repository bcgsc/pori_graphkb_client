import React from 'react';
import PropTypes from 'prop-types';

import FormField from '../FormField';
import { FORM_VARIANT } from '../util';
import schema from '../../../services/schema';

/**
 * Renders the two edge specific input fields (out/in)
 *
 * @param {ClassModel} props.model the current edge model
 * @param {function} props.onChange the parent change handler
 * @param {object} props.content the form content (key by property name)
 * @param {object} props.errors the form errors (key by property name)
 * @param {string} props.variant the form variant
 * @param {boolean} props.formIsDirty the form has had changes and is not identical to its initial pristine state
 */
const EdgeFields = ({
  model, onChange, content, errors, disabled, variant, formIsDirty,
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
      value={content.out}
      disabled={disabled}
      variant={variant}
      formIsDirty={formIsDirty}
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
      value={content.in}
      disabled={disabled}
      variant={variant}
      formIsDirty={formIsDirty}
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
  variant: PropTypes.string,
  formIsDirty: PropTypes.bool,
};

EdgeFields.defaultProps = {
  content: {},
  errors: {},
  disabled: false,
  variant: FORM_VARIANT.VIEW,
  formIsDirty: true,
};


export default EdgeFields;
