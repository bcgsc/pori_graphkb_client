import './index.scss';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { omit } from 'lodash';
import React, { useState } from 'react';

import FormField from '@/components/FormField';
import { shouldHideField, useFormContext } from '@/components/hooks/useSchemaForm';
import schema, { SchemaClassDefinition } from '@/services/schema';

const BELOW_FOLD = Object.keys(schema.get('V').properties);

const BELOW_FOLD_ORDER = ['@rid', 'createdBy', 'createdAt', 'deletedBy', 'deletedAt', 'updatedBy', 'updatedAt', 'uuid', 'history'];

/**
 * Given some model and options, sort the form fields and return the ordering. The 'fold'
 * described here is the collapsible block. Elements above the fold are in the top non-collapsed block
 * whereas fields below the fold are put into the collapsible section
 *
 * @returns {Object.<string,Array.<(string|Array.<string>)>>} the nested grouping structure
 *
 * @example
 * > sortAndGroupFields(schemaDefn.getProperties(model.name), {
 *    aboveFold: ['@class', '@rid', 'createdAt'],
 *    groups: [['createdBy', 'createdAt']]
 * })
 * {fields: ['@class', '@rid', ['createdBy', 'createdAt']], extraFields: []}
 */
export const sortAndGroupFields = (
  /** the current class model to base the form off of */
  model: Pick<SchemaClassDefinition, 'properties' | 'fieldOrder'>,
  opt: {
    /** flag to indicate if a collaspible section should be created */
    collapseExtra?: boolean;
    exclude?: string[];
  } = {},
) => {
  const mainFields: (string | string[])[] = [];
  const extraFields: (string | string[])[] = [];

  model.fieldOrder?.order?.forEach((groupOrItem) => {
    const group = Array.isArray(groupOrItem) ? groupOrItem : [groupOrItem];
    const filtered = group.filter((field) => Boolean(model.properties[field]) && !model.properties[field].hide && !opt.exclude?.includes(field));

    if (filtered.length === 1) {
      mainFields.push(filtered[0]);
    } else if (filtered.length) {
      mainFields.push(filtered);
    }
  });

  const exclude = [...opt.exclude || [], ...mainFields.flat()];
  const properties = omit(model.properties, exclude) as typeof model.properties;
  type Group = {
    fields: string[];
    aboveFold: boolean;
    required: boolean;
  };
  const fieldsMap: Record<string, Group> = {};

  Object.values(properties).forEach((prop) => {
    if (prop.hide) return;
    const required = Boolean(
      prop.mandatory
      && prop.default === undefined
      && !prop.generated,
    );
    fieldsMap[prop.name] = {
      fields: [prop.name],
      required,
      aboveFold: required || !(BELOW_FOLD.includes(prop.name) || prop.deprecated) || !opt.collapseExtra,
    };
  });

  [BELOW_FOLD_ORDER, ...model.fieldOrder?.groups ?? []].forEach((group) => {
    const filteredGroup = group.filter((key) => properties[key] && !properties[key].hide);
    if (!filteredGroup.length) return;
    const first = filteredGroup[0];
    let { aboveFold, required } = fieldsMap[first];
    filteredGroup.slice(1).forEach((key) => {
      aboveFold ||= fieldsMap[key].aboveFold;
      required ||= fieldsMap[key].required;

      delete fieldsMap[key];
    });

    fieldsMap[first] = {
      fields: filteredGroup,
      required,
      aboveFold,
    };
  });

  Object.values(fieldsMap).sort((groupA, groupB) => {
    if (groupA.required === groupB.required) {
      return groupA.fields[0].localeCompare(groupB.fields[0]);
    }
    return groupA.required ? -1 : 1;
  }).forEach((group) => {
    const fields = group.fields.length === 1 ? group.fields[0] : group.fields;

    if (group.aboveFold) {
      mainFields.push(fields);
    } else {
      extraFields.push(fields);
    }
  });
  return { fields: mainFields, extraFields };
};

interface FieldGroupProps {
  /** the property names in order to be rendered (array of array of strings for groups) */
  ordering: (string | string[])[];
}

/**
 * Given some ordering of fields (possibly grouped) return the set of fields
 */
const FieldGroup = ({ ordering }: FieldGroupProps) => ordering.map((itemOrGroup) => {
  if (Array.isArray(itemOrGroup)) {
    return (
      <List key={itemOrGroup.join('--')} className="form-layout__content-subgroup">
        {itemOrGroup.map((item) => (
          <FormField key={item} name={item} />
        ))}
      </List>
    );
  }
  return (
    <FormField key={itemOrGroup} name={itemOrGroup} />
  );
});

interface FormLayoutProps {
  /** css class to add to main element */
  className?: string;
  /** flag to indicate a collapsible section should be created */
  collapseExtra?: boolean;
  /** an array of fields not to display */
  exclusions?: string[];
}

const FormLayout = ({
  exclusions = [],
  className = '',
  collapseExtra = false,
}: FormLayoutProps) => {
  const form = useFormContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const hidden = Object.keys(form.model.properties).filter((name) => shouldHideField(form.variant, form.model.properties[name], form.content[name]));

  const { extraFields, fields } = sortAndGroupFields(form.model, {
    collapseExtra, exclude: [...exclusions, ...hidden],
  });

  return (
    <div className={`form-layout ${className}`}>
      <List className="form-layout__content">
        <FieldGroup ordering={fields} />
      </List>
      {extraFields.length > 0 && (
        <>
          <ListItem onClick={() => setIsExpanded(!isExpanded)}>
            <ListItemText
              primary={
                isExpanded
                  ? 'Close to hide optional fields'
                  : 'Expand to see all optional fields'
              }
            />
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List className="form-layout__content">
              <FieldGroup ordering={extraFields} />
            </List>
          </Collapse>
        </>
      )}
    </div>
  );
};

export default FormLayout;
