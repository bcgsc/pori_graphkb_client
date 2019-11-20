import PropTypes from 'prop-types';
import React from 'react';

import FormField from '../FormField';
import { FORM_VARIANT } from '../util';


/**
 * Given some ordering of fields (possibly grouped) return the set of fields
 *
 * @param {ClassModel} props.model
 * @param {Array.<Array.<string>|string>} props.ordering the property names in order to be rendered (array of array of strings for groups)
 * @param {Object} content the form content keyed by property name
 * @param {Object} errors form errors keyed by property name
 * @param {function} onChange parent form handler to pass to fields
 */
const FieldGroup = ({
  model, ordering, content, errors, variant, onChange, disabled, formIsDirty,
}) => {
  const { properties: { out, in: tgt, ...properties } } = model;

  // get the form content
  const fields = [];

  const filterGeneratedFields = (order) => {
    const newOrder = [];

    order.forEach((item) => {
      if (Array.isArray(item)) {
        const subgroup = filterGeneratedFields(item);

        if (subgroup.length) {
          newOrder.push(subgroup);
        }
      } else if (!properties[item] || !properties[item].generated) {
        if (!model.isEdge || !['out', 'in'].includes(item)) {
          newOrder.push(item);
        }
      }
    });
    return newOrder;
  };

  let filteredOrdering = ordering;

  if ((variant === FORM_VARIANT.EDIT || variant === FORM_VARIANT.NEW)) {
    filteredOrdering = filterGeneratedFields(ordering);
  }

  filteredOrdering.forEach((item) => {
    if (Array.isArray(item)) { // subgrouping
      const key = item.join('--');
      fields.push((
        <div key={key} className="record-form__content-subgroup">
          <FieldGroup
            content={content}
            errors={errors}
            onChange={onChange}
            ordering={item}
            model={model}
            disabled={disabled}
            variant={variant}
            formIsDirty={formIsDirty}
          />
        </div>
      ));
    } else if (properties[item]) {
      const prop = properties[item];
      const { name } = prop;
      const wrapper = (
        <FormField
          model={prop}
          value={content[name]}
          error={errors[name]}
          onChange={onChange}
          variant={variant}
          key={name}
          content={content}
          disabled={disabled}
          formIsDirty={formIsDirty}
        />
      );
      fields.push(wrapper);
    }
  });
  return (
    <React.Fragment>{fields}</React.Fragment>
  );
};


FieldGroup.propTypes = {
  model: PropTypes.object.isRequired,
  ordering: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ])).isRequired,
  onChange: PropTypes.func.isRequired,
  content: PropTypes.object,
  errors: PropTypes.object,
  disabled: PropTypes.bool,
  variant: PropTypes.string,
  formIsDirty: PropTypes.bool,
};

FieldGroup.defaultProps = {
  content: {},
  errors: {},
  disabled: false,
  variant: FORM_VARIANT.VIEW,
  formIsDirty: true,
};


export default FieldGroup;
