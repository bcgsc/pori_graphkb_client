import './index.scss';

import { List } from '@mui/material';
import React, { ReactNode } from 'react';

import { useFormContext } from '@/components/FormContext';
import FormField from '@/components/FormField';
import { FORM_VARIANT } from '@/components/util';
import schema, { SchemaClassDefinition } from '@/services/schema';

/**
 * returns an array of strings without any of the indicated exclusion values
 *
 * @param orderingList specifies property display ordering
 * @param exclusions fields that should not be rendered
 */
const exclusionFilter = (orderingList: (string | string[])[], exclusionList: string[]) => {
  const newOrdering: (string | string[])[] = [];
  orderingList.forEach((filter) => {
    if (Array.isArray(filter)) {
      newOrdering.push(exclusionFilter(filter, exclusionList) as string[]);
    } else if (!exclusionList.includes(filter)) {
      newOrdering.push(filter);
    }
  });
  return newOrdering;
};

const filterNullFields = (orderingList: (string | string[])[], formContent) => {
  const newOrdering: (string | string[])[] = [];
  orderingList.forEach((field) => {
    if (Array.isArray(field)) {
      newOrdering.push(filterNullFields(field, formContent) as string[]);
    } else if (formContent[field] !== '' && formContent[field] !== null && formContent[field] !== undefined) {
      newOrdering.push(field);
    }
  });
  return newOrdering;
};

interface FieldGroupProps {
  /** ClassModel */
  model: Partial<Pick<SchemaClassDefinition, 'properties' | 'name'>>;
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
  model, ordering, exclusions = [], disabled = false,
}: FieldGroupProps) => {
  const { formVariant, formContent } = useFormContext();
  let properties;

  if (model.name) {
    properties = schema.get(model.name).properties;
  } else {
    properties = model.properties; // Field Group is used by passing props in some cases
  }

  // get the form content
  const fields: ReactNode[] = [];

  function filterGeneratedFields(order: (string | string[])[]): (string | string[])[] {
    const newOrder: typeof order = [];

    order.forEach((item) => {
      if (Array.isArray(item)) {
        const subgroup = filterGeneratedFields(item) as string[];

        if (subgroup.length) {
          newOrder.push(subgroup);
        }
      } else if (!properties[item] || !properties[item].generated) {
        newOrder.push(item);
      }
    });
    return newOrder;
  }

  let filteredOrdering = ordering;

  if ((formVariant === FORM_VARIANT.EDIT || formVariant === FORM_VARIANT.NEW)) {
    filteredOrdering = filterGeneratedFields(ordering);
  } else if (formVariant === FORM_VARIANT.VIEW) {
    filteredOrdering = filterNullFields(filteredOrdering, formContent);
  }
  filteredOrdering = exclusionFilter(filteredOrdering, exclusions ?? []);

  filteredOrdering.forEach((item) => {
    if (Array.isArray(item)) { // subgrouping
      if (!item.length) return;
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

export default FieldGroup;
