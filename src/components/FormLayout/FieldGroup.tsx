import './index.scss';

import { List } from '@mui/material';
import React, { ReactNode, useMemo } from 'react';

import FormField from '@/components/FormField';
import { shouldHideField, useFormContext } from '@/components/hooks/useSchemaForm';

interface FieldGroupProps {
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
  ordering, exclusions = [], disabled = false,
}: FieldGroupProps) => {
  const { variant: formVariant, content: formContent, model } = useFormContext();
  const { properties } = model;

  // get the form content
  const fields: ReactNode[] = [];

  const filteredOrdering = useMemo(() => {
    const toExclude = [...exclusions];
    Object.values(properties).forEach((prop) => {
      if (shouldHideField(formVariant, prop, formContent[prop.name])) {
        toExclude.push(prop.name);
      }
    });

    const next: typeof ordering = [];
    ordering.forEach((item) => {
      if (Array.isArray(item)) {
        const nextItem = item.filter((name) => !toExclude.includes(name) && Boolean(properties[name]));

        if (nextItem.length) {
          next.push(nextItem);
        }
      } else if (!toExclude.includes(item) && properties[item]) {
        next.push(item);
      }
    });
    return next;
  }, [exclusions, formContent, formVariant, ordering, properties]);

  filteredOrdering.forEach((item) => {
    if (Array.isArray(item)) { // subgrouping
      if (!item.length) return;
      const key = item.join('--');
      fields.push((
        <List key={key} className="form-layout__content-subgroup">
          <FieldGroup
            disabled={disabled}
            ordering={item}
          />
        </List>
      ));
    } else {
      const wrapper = (
        <FormField
          key={item}
          disabled={disabled}
          name={item}
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
