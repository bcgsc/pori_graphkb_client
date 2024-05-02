import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import { List } from '@material-ui/core';
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

interface FieldGroupProps {
  /** ClassModel */
  model: Record<string, unknown>;
  /** the property names in order to be rendered (array of array of strings for groups) */
  ordering: (string | string[])[];
  /** if field should be disabled */
  disabled?: boolean;
  /** fields to be excluded from rendering */
  exclusions?: string[];
}

/**
 * Given some ordering of fields (possibly grouped) return the set of fields
 */
const FieldGroup = ({
  model, ordering, exclusions, disabled,
}: FieldGroupProps) => {
  const { formVariant, formContent } = useContext(FormContext);
  let properties;

  if (model.name) {
    properties = schemaDefn.getProperties(model.name);
  } else {
    properties = model.properties;
  }

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
    <>{fields}</>
  );
};

FieldGroup.defaultProps = {
  exclusions: [],
  disabled: false,
};

export default FieldGroup;
