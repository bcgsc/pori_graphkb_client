import { List } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import FormField from '@/components/FormField';
import { FORM_VARIANT } from '@/components/util';

/**
 * returns an array of strings without any of the indicated exclusion values
 *
 * @param {Array.<string>} orderingList specifies property display ordering
 * @param {Array.<string>} exclusions fields that should not be rendered
 */
const exclusionFilter = (orderingList, exclusionList) => {
  const newOrdering = [];
  orderingList.forEach((filter) => {
    if (Array.isArray(filter)) {
      newOrdering.push(exclusionFilter(filter, exclusionList));
    } else if (!exclusionList.includes(filter)) {
      newOrdering.push(filter);
    }
  });
  return newOrdering;
};

/**
 * Given some ordering of fields (possibly grouped) return the set of fields
 *
 * @param {ClassModel} props.model
 * @param {Array.<Array.<string>|string>} props.ordering the property names in order to be rendered (array of array of strings for groups)
 * @param {Object} content the form content keyed by property name
 * @param {Object} errors form errors keyed by property name
 * @param {Array.<string>} exclusions fields to be excluded from rendering
 * @param {function} onChange parent form handler to pass to fields
 * @param {bool} formIsDirty if the form has been modified at all
 * @param {String} variant one of ['new', 'edit', 'search]
 * @param {bool} disabled if field should be disabled
 */
const FieldGroup = ({
  model, ordering, content, errors, exclusions, variant, onChange, disabled, formIsDirty,
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
  filteredOrdering = exclusionFilter(filteredOrdering, exclusions);


  filteredOrdering.forEach((item) => {
    if (Array.isArray(item)) { // subgrouping
      const key = item.join('--');
      fields.push((
        <List key={key} className="record-form__content-subgroup">
          <FieldGroup
            content={content}
            disabled={disabled}
            errors={errors}
            formIsDirty={formIsDirty}
            model={model}
            onChange={onChange}
            ordering={item}
            variant={variant}
          />
        </List>
      ));
    } else if (properties[item]) {
      const prop = properties[item];
      const { name } = prop;
      const wrapper = (
        <FormField
          key={name}
          content={content}
          disabled={disabled}
          error={errors[name]}
          formIsDirty={formIsDirty}
          model={prop}
          onChange={onChange}
          value={content[name]}
          variant={variant}
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
  onChange: PropTypes.func.isRequired,
  ordering: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ])).isRequired,
  content: PropTypes.object,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  exclusions: PropTypes.arrayOf(PropTypes.string),
  formIsDirty: PropTypes.bool,
  variant: PropTypes.string,
};

FieldGroup.defaultProps = {
  content: {},
  errors: {},
  exclusions: [],
  disabled: false,
  variant: FORM_VARIANT.VIEW,
  formIsDirty: true,
};


export default FieldGroup;
