import './index.scss';

import { List } from '@mui/material';
import React, { ReactNode, useMemo } from 'react';

import { useFormContext } from '@/components/FormContext';
import FormField from '@/components/FormField';
import { FORM_VARIANT } from '@/components/util';
import schema, { SchemaClassDefinition } from '@/services/schema';

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
  const properties = useMemo(() => {
    if (model.name) {
      return schema.get(model.name).properties;
    } if (model.properties) {
      return model.properties; // Field Group is used by passing props in some cases
    }
    return {};
  }, [model]);

  // get the form content
  const fields: ReactNode[] = [];

  const filteredOrdering = useMemo(() => {
    const toExclude = [...exclusions];
    Object.values(properties).forEach((prop) => {
      const isEmpty = formContent[prop.name] === '' || formContent[prop.name] === null || formContent[prop.name] === undefined;

      if (
        (formVariant === FORM_VARIANT.NEW && prop.generated)
        || (formVariant === FORM_VARIANT.EDIT && prop.generated && isEmpty)
        || (formVariant === FORM_VARIANT.VIEW && isEmpty)
      ) {
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
            model={model}
            ordering={item}
          />
        </List>
      ));
    } else {
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
