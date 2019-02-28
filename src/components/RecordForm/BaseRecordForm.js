import React from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';
import {
  Collapse,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import jc from 'json-cycle';


import { KBContext } from '../KBContext';
import ActionButton from '../ActionButton';


import FormField from './FormField';
import PutativeEdgeField from './FormField/PutativeEdgeField';
import { EdgeTable } from './EdgeTable';
import StatementSentence from './StatementSentence';
import {
  CLASS_MODEL_PROP,
  FORM_VARIANT,
  validateValue,
} from './util';


/**
 * @property {object} props the input properties
 * @property {string} props.name the name of this form element used in propgating content to the parent form
 * @property {function} props.onValueChange the parent handler function
 * @property {function} props.onSubmit the parent handler function to submit the form contents
 * @property {function} props.onDelete the parent handler function to delete the current record
 */
class BaseRecordForm extends React.Component {
  static contextType = KBContext;

  static propTypes = {
    aboveFold: PropTypes.arrayOf(PropTypes.string),
    onSubmit: PropTypes.func,
    onDelete: PropTypes.func,
    belowFold: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string,
    collapseExtra: PropTypes.bool,
    groups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    isEmbedded: PropTypes.bool,
    modelChoices: PropTypes.arrayOf(PropTypes.oneOf(PropTypes.string, PropTypes.shape({
      label: PropTypes.string,
      caption: PropTypes.string,
      key: PropTypes.string,
      value: PropTypes.string,
    }))),
    modelName: PropTypes.string,
    name: PropTypes.string.isRequired,
    onValueChange: PropTypes.func,
    value: PropTypes.object,
    variant: PropTypes.oneOf([
      FORM_VARIANT.EDIT,
      FORM_VARIANT.NEW,
      FORM_VARIANT.VIEW,
    ]),
  };

  static defaultProps = {
    aboveFold: ['@rid', CLASS_MODEL_PROP, 'name', 'journalName', 'out', 'in'],
    belowFold: ['deprecated', 'history'],
    className: '',
    collapseExtra: false,
    groups: [
      ['createdBy', 'createdAt', 'deletedBy', 'deletedAt', 'uuid', 'history', 'groupRestrictions'],
      ['reference1', 'break1Repr', 'break1Start', 'break1End'],
      ['reference2', 'break2Repr', 'break2Start', 'break2End'],
      ['source', 'sourceId', 'sourceIdVersion'],
      ['startYear', 'completionYear'],
      ['city', 'country'],
      ['out', 'in'],
    ],
    isEmbedded: false,
    modelChoices: [],
    modelName: null,
    onDelete: null,
    onSubmit: null,
    onValueChange: null,
    value: { [CLASS_MODEL_PROP]: null },
    variant: FORM_VARIANT.VIEW,
  };

  constructor(props) {
    super(props);
    const { value } = this.props;
    this.state = {
      content: value || { [CLASS_MODEL_PROP]: null },
      errors: {},
      collapseOpen: false,
    };
  }

  /**
   * Trigger the state change if a new initial value is passed in
   */
  componentDidUpdate(prevProps) {
    const { value } = this.props;

    if (jc.stringify(value) !== jc.stringify(prevProps.value)) {
      this.populateFromRecord(value);
    }
  }

  /**
   * Given the current content and schema, sort the form fields and return the ordering
   * @returns {Array.<Array.<(string|Array.<string>)>>} the nested grouping structure
   *
   * @example no collapsible section given
   * > this.sortAndGroupFields()
   * [['@class', '@rid', ['createdBy', 'createdAt']], []]
   */
  sortAndGroupFields() {
    const {
      belowFold, aboveFold, collapseExtra, groups, variant,
    } = this.props;
    const { schema } = this.context;
    const { content } = this.state;

    const groupMap = {};
    const model = schema.get(content);

    if (!model) {
      return { extraFields: [], fields: [] };
    }
    const { properties } = model;

    groups.forEach((groupItems) => {
      // assume each field only can belong to a single group, overwrite others
      const key = groupItems.slice().sort((p1, p2) => p1.localeCompare(p2)).join('-');
      const groupDefn = {
        fields: groupItems.filter(fname => properties[fname]),
        mandatory: false,
        generated: true,
        name: key,
      };

      if (groupDefn.fields.length > 1) {
        groupDefn.fields.forEach((name) => {
          const { mandatory, generated } = properties[name];
          groupDefn.mandatory = groupDefn.mandatory || mandatory;
          groupDefn.generated = groupDefn.generated && generated;
          groupMap[name] = groupDefn;
        });
      }
    });

    const mainFields = [];
    const extraFields = [];

    const visited = new Set();

    // get the form content
    Object.values(
      model.properties,
    ).filter(
      p => p.name !== CLASS_MODEL_PROP && (variant !== FORM_VARIANT.NEW || !p.generated),
    ).sort(
      (p1, p2) => p1.name.localeCompare(p2.name), // alphanumeric sort by name
    ).forEach(
      (prop) => {
        const {
          name, mandatory, generated, fields,
        } = (groupMap[prop.name] || prop);

        const isAboveFold = fields
          ? fields.some(fname => aboveFold.includes(fname))
          : aboveFold.includes(name);

        const isBelowFold = fields
          ? fields.some(fname => belowFold.includes(fname))
          : belowFold.includes(name);

        const mustBeFilled = (
          prop.mandatory
          && variant === FORM_VARIANT.NEW
          && prop.default === undefined
          && !prop.generated
        );

        if (!visited.has(name)) {
          if (!collapseExtra || isAboveFold || mustBeFilled) {
            mainFields.push(fields || name);
          } else if (isBelowFold) {
            extraFields.push(fields || name);
          } else if (mandatory && !generated) {
            mainFields.push(fields || name);
          } else {
            extraFields.push(fields || name);
          }
        }
        visited.add(name);
        if (fields) {
          visited.add(...fields);
        }
      },
    );
    return { fields: mainFields, extraFields };
  }


  /**
   * Fill out the form fields using some record
   */
  populateFromRecord(record) {
    const { schema } = this.context;
    const { content } = this.state;

    const model = schema.get(record);

    if (!model) {
      return;
    }

    // do we need to update the model?
    const newContent = Object.assign({}, content);
    const errors = {};

    Object.values(model.properties).forEach((prop) => {
      const rawValue = record[prop.name];
      const { value, error } = validateValue(prop, rawValue);
      newContent[prop.name] = value;
      if (error) {
        errors[prop.name] = error;
      }
    });
    // statement required edge inputs
    if (model.name === 'Statement') {
      ['impliedBy', 'supportedBy'].forEach((prop) => {
        const edgeEquivalent = `out_${prop[0].toUpperCase()}${prop.slice(1)}`;
        const edges = (record[edgeEquivalent] || []).map(e => ({ target: e.in }));
        const rawValue = record[prop] || edges;
        if (!rawValue || rawValue.length < 1) {
          errors[prop] = 'At least one value is required';
        }
        newContent[prop] = rawValue;
      });
    }
    this.setState({ content: newContent, errors });
  }

  /**
   * Handler for any changes to individual form fields
   */
  @boundMethod
  handleValueChange(event) {
    const { onValueChange, name } = this.props;
    const { content } = this.state;

    const newContent = Object.assign({}, content);
    // add the new value to the field
    const propName = event.target.name || event.target.getAttribute('name'); // name of the form field triggering the event
    const newValue = event.target.value;

    newContent[propName] = newValue;

    this.populateFromRecord(newContent);
    if (onValueChange) {
      // propogate the event to the parent container
      onValueChange({
        target: {
          name,
          value: newContent,
        },
      });
    }
  }

  @boundMethod
  handleExpand() {
    const { collapseOpen } = this.state;
    this.setState({ collapseOpen: !collapseOpen });
  }

  @boundMethod
  async handleAction(handler) {
    const { content, errors } = this.state;

    if (handler) {
      await handler({
        content, errors,
      });
    }
  }

  /**
   * Given some ordering of fields (possibly grouped) return the set of fields
   */
  renderFieldGroup(ordering) {
    const { schema } = this.context;
    const { variant } = this.props;
    const { content, errors } = this.state;

    const model = schema.get(content);
    const { properties } = model;

    // get the form content
    const fields = [];

    ordering.forEach((item) => {
      if (item instanceof Array) { // subgrouping
        const key = item.join('--');
        fields.push((
          <div key={key} className="node-form__content-subgroup">
            {this.renderFieldGroup(item)}
          </div>
        ));
      } else {
        const prop = properties[item];
        const { name } = prop;
        const wrapper = FormField({
          model: prop,
          value: content[name],
          error: errors[name],
          onValueChange: this.handleValueChange,
          schema,
          variant,
          disabled: variant === FORM_VARIANT.VIEW,
        });
        fields.push(wrapper);
      }
    });

    return fields;
  }

  /**
   * Renders the two statement specific input fields (impliedBy and SupportedBy)
   */
  renderStatementFields() {
    // cache disabling related to: https://github.com/JedWatson/react-select/issues/2582
    const { schema } = this.context;
    const { content } = this.state;
    const { variant } = this.props;

    return (
      <React.Fragment key="statement-content">
        <StatementSentence
          schema={schema}
          content={content}
        />
        <PutativeEdgeField
          disableCache
          label="ImpliedBy"
          linkedClassName="Biomarker"
          name="impliedBy"
          onValueChange={this.handleValueChange}
          schema={schema}
          value={content.impliedBy}
          description="Conditions that when combined imply the statement"
          disabled={variant === FORM_VARIANT.VIEW}
        />
        <PutativeEdgeField
          disableCache
          label="SupportedBy"
          linkedClassName="Evidence"
          name="supportedBy"
          onValueChange={this.handleValueChange}
          schema={schema}
          value={content.supportedBy}
          description="Publications and Records that support the conclusion of the current statement"
          disabled={variant === FORM_VARIANT.VIEW}
        />
      </React.Fragment>
    );
  }

  render() {
    const {
      className,
      isEmbedded,
      modelChoices,
      modelName,
      onSubmit,
      onDelete,
      value,
      variant,
    } = this.props;
    const { schema } = this.context;
    const {
      content,
      errors,
      collapseOpen,
    } = this.state;
    let model = schema.get(content);
    if (model.isAbstract && variant === FORM_VARIANT.NEW) {
      model = null;
    }

    let edges = isEmbedded
      ? []
      : schema.getEdges(value || {});
    const isStatement = model && model.name === 'Statement';
    if (isStatement) {
      edges = edges.filter(e => !['SupportedBy', 'ImpliedBy'].includes(e[CLASS_MODEL_PROP]));
    }

    if (modelChoices.length === 0) {
      if (content[CLASS_MODEL_PROP] && !schema.get(content).isAbstract) {
        modelChoices.push(content[CLASS_MODEL_PROP]);
      } else if (variant === FORM_VARIANT.NEW) {
        modelChoices.push(
          ...schema.get(modelName || 'V').descendantTree(true).map(m => ({
            label: m.name, value: m.name, key: m.name, caption: m.description,
          })),
        );
        modelChoices.sort((a, b) => a.label.localeCompare(b.label));
      }
    }

    const { extraFields, fields } = this.sortAndGroupFields();

    // Select the class model to build the rest of the form
    const classSelect = FormField({
      model: Object.assign(
        {},
        model
          ? model.properties[CLASS_MODEL_PROP]
          : {},
        { choices: modelChoices, required: true, name: CLASS_MODEL_PROP },
      ),
      value: content[CLASS_MODEL_PROP],
      error: errors[CLASS_MODEL_PROP],
      onValueChange: this.handleValueChange,
      disabled: modelChoices.length < 2
        || (variant !== FORM_VARIANT.NEW && !isEmbedded)
        || variant === FORM_VARIANT.SEARCH,
      schema,
      className: 'node-form__class-select',
    });

    return (
      <div className={`node-form ${className}`}>
        <div className="node-form__content node-form__content--long">
          {classSelect}
          {isStatement && variant !== FORM_VARIANT.EDIT && this.renderStatementFields()}
        </div>
        <div className="node-form__content">
          {model && this.renderFieldGroup(fields)}
        </div>
        {extraFields.length > 0 && (
          <>
            <ListItem button onClick={this.handleExpand}>
              <ListItemText
                primary={
                  collapseOpen
                    ? 'Close to hide optional fields'
                    : 'Expand to see all optional fields'
                }
              />
              {collapseOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={collapseOpen} timeout="auto" unmountOnExit>
              <div className="node-form__content">
                {model && this.renderFieldGroup(extraFields)}
              </div>
            </Collapse>
          </>
        )}
        {!isEmbedded && variant !== FORM_VARIANT.VIEW && (
          <div className="node-form__action-buttons">
            {onDelete && variant === FORM_VARIANT.EDIT && (
              <ActionButton
                onClick={() => this.handleAction(onDelete)}
                variant="outlined"
                size="large"
                message="Are you sure you want to delete this record?"
              >
                DELETE
              </ActionButton>
            )}
            {onSubmit && (
              <ActionButton
                onClick={() => this.handleAction(onSubmit)}
                variant="contained"
                color="primary"
                size="large"
                requireConfirm={false}
              >
                {variant === FORM_VARIANT.EDIT
                  ? 'SUBMIT CHANGES'
                  : 'SUBMIT'
                }
              </ActionButton>
            )}
          </div>
        )}
        {!isEmbedded && variant === FORM_VARIANT.VIEW && edges.length > 0 && (
          <div className="node-form__related-nodes">
            <Typography variant="h6" component="h2">
              Related Nodes
            </Typography>
            <EdgeTable
              values={edges}
              sourceNodeId={content['@rid']}
            />
          </div>
        )}
      </div>
    );
  }
}

export default BaseRecordForm;
