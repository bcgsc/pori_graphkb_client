import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import React, { useContext, useEffect, useState } from 'react';

import FormContext from '@/components/FormContext';
import EdgeSentence from '@/components/SentencePreview/EdgeSentence';
import StatementSentence from '@/components/SentencePreview/StatementSentence';
import {
  CLASS_MODEL_PROP,
  FORM_VARIANT,
  sortAndGroupFields,
} from '@/components/util';

import { ModelDefinition } from '../types';
import EdgeFields from './EdgeFields';
import FieldGroup from './FieldGroup';

/** the property names which should be put above the collapse */
const aboveFold = [
  CLASS_MODEL_PROP,
  'displayName',
  'name',
  'groups',
  'journalName',
  'out',
  'in',
  'permissions',
  'evidenceLevel',
  'reviewStatus',
  'reviews',
  'refSeq',
  'recruitmentStatus',
  'email',
  'source',
  'sourceId',
];

/** the property names which should be put in the collapsed section */
const belowFold = ['deprecated', 'history'];

/** properties that should be grouped together */
const groups = [
  ['@rid', 'createdBy', 'createdAt', 'deletedBy', 'deletedAt', 'updatedBy', 'updatedAt', 'uuid', 'history', 'groupRestrictions'],
  ['relevance', 'subject'],
  ['refSeq', 'untemplatedSeq'],
  ['reviewStatus', 'reviews'],
  ['reference1', 'break1Repr', 'break1Start', 'break1End'],
  ['reference2', 'break2Repr', 'break2Start', 'break2End'],
  ['source', 'sourceId', 'sourceIdVersion'],
  ['startYear', 'completionYear'],
  ['city', 'country'],
  ['out', 'in'],
];

const exclusions = ['groupRestrictions'];

interface FormLayoutProps {
  /** flag to indicated form fields are disabled */
  disabled?: boolean;
  /** the name of the schema model to use */
  modelName?: string;
}

const FormLayout = ({
  modelName, disabled,
}: FormLayoutProps) => {
  const {
    formContent = {}, formVariant,
  } = useContext(FormContext);
  const [isExpanded, setIsExpanded] = useState(false);

  const [model, setModel] = useState<ModelDefinition | null | undefined>(null);

  useEffect(() => {
    setModel(schemaDefn.get(modelName));
  }, [modelName]);

  if (!model) {
    return null;
  }

  const { extraFields, fields } = sortAndGroupFields(model, {
    aboveFold, belowFold, collapseExtra: true, variant: formVariant, groups,
  });

  const isEdge = model && model.isEdge;

  const isStatement = model && model.name === 'Statement';

  return (
    <div className="form-layout">
      {model && (
        <>
          <div className="form-layout__content form-layout__content--long">
            {isStatement && formVariant !== FORM_VARIANT.SEARCH && (
              <StatementSentence
                content={formContent}
              />
            )}
            {isEdge && formVariant !== FORM_VARIANT.SEARCH && (
              <EdgeSentence
                srcRecord={formContent.out}
                tgtRecord={formContent.in}
                type={model.name}
              />
            )}
          </div>
          <List className="form-layout__content">
            {isEdge && <EdgeFields disabled={disabled} model={model} />}
            <FieldGroup
              disabled={disabled}
              exclusions={exclusions}
              model={model}
              ordering={fields}
            />
          </List>
          {extraFields.length > 0 && (
            <>
              <ListItem button onClick={() => setIsExpanded(!isExpanded)}>
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

FormLayout.defaultProps = {
  disabled: false,
  modelName: null,
};

export default FormLayout;
