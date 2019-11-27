import PropTypes from 'prop-types';
import React from 'react';

import schema from '@/services/schema';

import FormField from '../FormField';
import { FORM_VARIANT } from '../util';

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
      disabled={disabled}
      error={errors.out || ''}
      formIsDirty={formIsDirty}
      label="Source Record (out)"
      model={{
        description: 'The source record for the relationship',
        linkedClass: schema.get(model.sourceModel || 'V'),
        name: 'out',
        type: 'link',
        mandatory: true,
        nullable: false,
      }}
      onChange={onChange}
      value={content.out}
      variant={variant}
    />
    <FormField
      disabled={disabled}
      error={errors.in || ''}
      formIsDirty={formIsDirty}
      label="Target Record (in)"
      model={{
        linkedClass: schema.get(model.targetModel || 'V'),
        description: 'The target record for the relationship',
        name: 'in',
        type: 'link',
        mandatory: true,
        nullable: false,
      }}
      onChange={onChange}
      value={content.in}
      variant={variant}
    />
  </React.Fragment>
);


EdgeFields.propTypes = {
  model: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  content: PropTypes.object,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  formIsDirty: PropTypes.bool,
  variant: PropTypes.string,
};

EdgeFields.defaultProps = {
  content: {},
  errors: {},
  disabled: false,
  variant: FORM_VARIANT.VIEW,
  formIsDirty: true,
};


export default EdgeFields;
