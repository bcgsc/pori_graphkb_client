import './index.scss';

import { List } from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';

import FormContext from '@/components/FormContext';
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

const filterNullFields = (orderingList, formContent) => {
  const newOrdering = [];
  orderingList.forEach((field) => {
    if (Array.isArray(field)) {
      newOrdering.push(filterNullFields(field, formContent));
    } else if (formContent[field] === 0 || formContent[field]) {
      newOrdering.push(field);
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
  model, ordering, exclusions, disabled,
}) => {
  const { formVariant, formContent } = useContext(FormContext);
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

  if ((formVariant === FORM_VARIANT.EDIT || formVariant === FORM_VARIANT.NEW)) {
    filteredOrdering = filterGeneratedFields(ordering);
  } else if (formVariant === FORM_VARIANT.VIEW) {
    filteredOrdering = filterNullFields(filteredOrdering, formContent);
  }
  filteredOrdering = exclusionFilter(filteredOrdering, exclusions);

  filteredOrdering.forEach((item) => {
    if (Array.isArray(item)) { // subgrouping
      const key = item.join('--');
      fields.push((
        <List key={key} className="form-layout__content-subgroup">
          <FieldGroup
            disabled={disabled}
            model={model}
            ordering={item}
          />
        </List>
      ));
    } else if (properties[item]) {
      const prop = properties[item];
      const { name } = prop;
      const wrapper = (
        <FormField
          key={name}
          disabled={disabled}
          model={prop}
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
  disabled: PropTypes.bool,
  exclusions: PropTypes.arrayOf(PropTypes.string),
};

FieldGroup.defaultProps = {
  exclusions: [],
  disabled: false,
};


export default FieldGroup;
