import {
  Collapse,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import EdgeSentence from '@/components/SentencePreview/EdgeSentence';
import StatementSentence from '@/components/SentencePreview/StatementSentence';
import schema from '@/services/schema';

import EdgeTable from '../EdgeTable';
import {
  CLASS_MODEL_PROP,
  FORM_VARIANT,
  sortAndGroupFields,
} from '../util';
import EdgeFields from './EdgeFields';
import FieldGroup from './FieldGroup';


/**
 * @param {object} props the input properties
 * @param {string} props.modelName the name of the schema model to use
 * @param {function} props.onChange the parent handler function
 * @param {Array.<string>} props.aboveFold the property names which should be put above the collapse
 * @param {Array.<string>} props.belowFold the property names which should be put in the collapsed section
 * @param {Array.<Array.<string>>} props.groups properties that should be grouped together
 * @param {bool} props.collapseExtra flag to indicate a collapsible section should be created
 * @param {bool} props.formIsDirty flag to indicate if the form has had any changes
 * @param {object} props.content the form content
 * @param {object} props.errors the form errors
 * @param {string} props.variant the form variant
 * @param {bool} props.disabled flag to indicated form fields are disabled
 * @param {string} props.className css class to add to main element
 */
const FormLayout = ({
  content, errors, onChange, variant, modelName, disabled, className, aboveFold, belowFold, collapseExtra, groups, formIsDirty,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const [model, setModel] = useState(null);

  useEffect(() => {
    setModel(schema.get(modelName));
  }, [modelName]);

  if (!model) {
    return null;
  }

  const { extraFields, fields } = sortAndGroupFields(model, {
    aboveFold, belowFold, collapseExtra, variant, groups,
  });

  const isEdge = model && model.isEdge;

  const edges = isEdge
    ? []
    : schema.getEdges(content || {});
  const isStatement = model && model.name === 'Statement';

  return (
    <div className={`record-form ${className}`}>
      { model && (
      <>
        <div className="record-form__content record-form__content--long">
          {isStatement && variant !== FORM_VARIANT.SEARCH && (
            <StatementSentence
              content={content}
            />
          )}
          {isEdge && variant !== FORM_VARIANT.SEARCH && (
            <EdgeSentence
              srcRecord={content.out}
              tgtRecord={content.in}
              type={model.name}
            />
          )}
          {isEdge && (
            <EdgeFields
              formIsDirty={formIsDirty}
              content={content}
              errors={errors}
              onChange={onChange}
              model={model}
              disabled={disabled}
              variant={variant}
            />
          )}
        </div>
        <div className="record-form__content">
          <FieldGroup
            formIsDirty={formIsDirty}
            content={content}
            errors={errors}
            onChange={onChange}
            ordering={fields}
            model={model}
            disabled={disabled}
            variant={variant}
          />
        </div>
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
            <div className="record-form__content">
              <FieldGroup
                formIsDirty={formIsDirty}
                content={content}
                errors={errors}
                onChange={onChange}
                ordering={extraFields}
                model={model}
                disabled={disabled}
                variant={variant}
              />
            </div>
          </Collapse>
        </>
        )}

        {!variant === FORM_VARIANT.VIEW && edges.length > 0 && (
          <div className="record-form__related-nodes">
            <Typography variant="h6" component="h2">
              Related Nodes
            </Typography>
            <EdgeTable
              values={edges}
              sourceNodeId={content['@rid']}
            />
          </div>
        )}
      </>
      )}
    </div>
  );
};

FormLayout.propTypes = {
  aboveFold: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  belowFold: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
  collapseExtra: PropTypes.bool,
  groups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
  modelName: PropTypes.string,
  onChange: PropTypes.func,
  content: PropTypes.object,
  errors: PropTypes.object,
  variant: PropTypes.oneOf([
    FORM_VARIANT.EDIT,
    FORM_VARIANT.NEW,
    FORM_VARIANT.VIEW,
  ]),
  formIsDirty: PropTypes.bool,
};

FormLayout.defaultProps = {
  aboveFold: [CLASS_MODEL_PROP, 'displayName', 'name', 'groups', 'journalName', 'out', 'in',
    'permissions', 'evidenceLevel', 'reviewStatus', 'reviews', 'refSeq'],
  disabled: false,
  belowFold: ['deprecated', 'history'],
  className: '',
  collapseExtra: false,
  groups: [
    ['@rid', 'createdBy', 'createdAt', 'deletedBy', 'deletedAt', 'uuid', 'history', 'groupRestrictions'],
    ['relevance', 'subject'],
    ['refSeq', 'untemplatedSeq'],
    ['reviewStatus', 'reviews'],
    ['reference1', 'break1Repr', 'break1Start', 'break1End'],
    ['reference2', 'break2Repr', 'break2Start', 'break2End'],
    ['source', 'sourceId', 'sourceIdVersion'],
    ['startYear', 'completionYear'],
    ['city', 'country'],
    ['out', 'in'],
  ],
  modelName: null,
  onChange: () => null,
  content: {},
  errors: {},
  variant: FORM_VARIANT.VIEW,
  formIsDirty: true,
};

export default FormLayout;
