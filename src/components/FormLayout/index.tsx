import './index.scss';

import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material';
import { omit } from 'lodash';
import React, { useId, useState } from 'react';

import FormField from '@/components/FormField';
import { shouldHideField, useFormContext } from '@/components/hooks/useSchemaForm';
import schema, { SchemaClassDefinition } from '@/services/schema';

interface ColumnLayoutProps {
  children: React.ReactNode;
}

const ColumnLayout = ({ children }: ColumnLayoutProps) => (
  <div className="column-layout-container">
    <div className="column-layout">
      {children}
    </div>
  </div>
);

interface LayoutGroupProps {
  children: React.ReactNode;
  outlined?: boolean;
}

const LayoutGroup = ({ children, outlined }: LayoutGroupProps) => (
  <div className={`column-layout__group${outlined ? ' column-layout__group--outlined' : ''}`}>
    {children}
  </div>
);

interface LayoutItemProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  outlined?: boolean;
}

/**
 * optional wrapper for an item in the column layout, allowing full width and outlined styles.
 */
const LayoutItem = ({ children, fullWidth, outlined }: LayoutItemProps) => (
  <div className={`column-layout__item${fullWidth ? ' column-layout__item--full-width' : ''}${outlined ? ' column-layout__item--outlined' : ''}`}>
    {children}
  </div>
);

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
  // if only 1 item, make it full width
  if (ordering.length === 1 && !Array.isArray(ordering[0])) {
    return (
      <LayoutItem key={ordering[0]} fullWidth>
        <FormField name={ordering[0]} />
      </LayoutItem>
    );
  }
  if (Array.isArray(itemOrGroup)) {
    return (
      <LayoutGroup key={itemOrGroup.join('-')} outlined>
        {itemOrGroup.map((item) => (
          <FormField key={item} name={item} />
        ))}
      </LayoutGroup>
    );
  }
  return (
    <FormField key={itemOrGroup} name={itemOrGroup} />
  );
});

function CollapsibleSection({ children }: { children: React.ReactNode }) {
  const id = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={isExpanded}
      onChange={() => setIsExpanded(!isExpanded)}
      square
      sx={{
        background: 'transparent',
        '&::before': {
          display: 'none',
        },
        '& .MuiAccordionDetails-root': {
          padding: 0,
        },
        '& .MuiAccordion-heading button': {
          padding: 0,
        },
      }}
    >
      <AccordionSummary
        aria-controls={`${id}-content`}
        expandIcon={<ExpandMore />}
        id={`${id}-header`}
      >
        <Typography component="span">
          {isExpanded
            ? 'Close to hide additional fields'
            : 'Expand to see additional fields'}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

interface FormLayoutProps {
  /** flag to indicate a collapsible section should be created */
  collapseExtra?: boolean;
  /** an array of fields not to display */
  exclusions?: string[];
  children?: React.ReactNode;
}

const FormLayout = ({
  exclusions = [],
  collapseExtra = false,
  children,
}: FormLayoutProps) => {
  const form = useFormContext();
  const hidden = Object.keys(form.model.properties).filter((name) => shouldHideField(form.variant, form.model.properties[name], form.content[name]));

  const { extraFields, fields } = sortAndGroupFields(form.model, {
    collapseExtra, exclude: [...exclusions, ...hidden],
  });

  return (
    <Stack spacing={1}>
      <ColumnLayout>
        {children}
        <FieldGroup ordering={fields} />
      </ColumnLayout>
      {extraFields.length > 0 && (
        <CollapsibleSection>
          <ColumnLayout>
            <FieldGroup ordering={extraFields} />
          </ColumnLayout>
        </CollapsibleSection>
      )}
    </Stack>
  );
};

export default FormLayout;
export { LayoutGroup, LayoutItem };
