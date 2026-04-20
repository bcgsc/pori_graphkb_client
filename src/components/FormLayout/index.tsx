import './index.scss';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import React, { useState } from 'react';

import { useFormContext } from '@/components/FormContext';
import { sortAndGroupFields } from '@/components/util';
import schema from '@/services/schema';

import FieldGroup from './FieldGroup';

interface FormLayoutProps {
  /** css class to add to main element */
  className?: string;
  /** flag to indicate a collapsible section should be created */
  collapseExtra?: boolean;
  /** flag to indicated form fields are disabled */
  disabled?: boolean;
  /** an array of fields not to display */
  exclusions?: string[];
  /** properties that should be grouped together */
  groups?: string[][];
  /** the name of the schema model to use */
  modelName?: string;
}

const FormLayout = ({
  exclusions = [],
  modelName,
  disabled = false,
  className = '',
  collapseExtra = false,
  groups = [
    ['@rid', 'createdBy', 'createdAt', 'deletedBy', 'deletedAt', 'updatedBy', 'updatedAt', 'uuid', 'history', 'groupRestrictions'],
    ['relevance', 'subject'],
    ['refSeq', 'untemplatedSeq'],
    ['reviewStatus', 'reviews'],
    ['reference1', 'break1Repr', 'break1Start', 'break1End', 'reference2', 'break2Repr', 'break2Start', 'break2End'],
    ['source', 'sourceId', 'sourceIdVersion'],
    ['startYear', 'completionYear'],
    ['city', 'country'],
    ['out', 'in'],
  ],
}: FormLayoutProps) => {
  const {
    formVariant,
  } = useFormContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const model = schema.get(modelName);

  if (!formVariant) {
    return null;
  }

  const { extraFields, fields } = sortAndGroupFields(model.properties, {
    collapseExtra, groups,
  });

  return (
    <div className={`form-layout ${className}`}>
      {model && (
        <>
          <List className="form-layout__content">
            <FieldGroup
              disabled={disabled}
              exclusions={exclusions}
              model={model}
              ordering={fields}
            />
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
                  <FieldGroup
                    disabled={disabled}
                    exclusions={exclusions}
                    model={model}
                    ordering={extraFields}
                  />
                </List>
              </Collapse>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FormLayout;
