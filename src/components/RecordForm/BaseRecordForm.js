import React from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';
import {
  Collapse,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import jc from 'json-cycle';


import { KBContext } from '../KBContext';
import ActionButton from '../ActionButton';


import FormField from './FormField';
import EdgeTable from './EdgeTable';
import StatementSentence from './StatementSentence';
import {
  CLASS_MODEL_PROP,
  FORM_VARIANT,
  validateValue,
  sortAndGroupFields,
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
    actionInProgress: PropTypes.bool,
    onSubmit: PropTypes.func,
    onDelete: PropTypes.func,
    belowFold: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string,
    collapseExtra: PropTypes.bool,
    groups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    isEmbedded: PropTypes.bool,
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
    aboveFold: [CLASS_MODEL_PROP, 'displayName', 'name', 'groups', 'journalName', 'out', 'in', 'permissions', 'evidenceLevel', 'description', 'reviewStatus'],
    actionInProgress: false,
    belowFold: ['deprecated', 'history'],
    className: '',
    collapseExtra: false,
    groups: [
      ['@rid', 'createdBy', 'createdAt', 'deletedBy', 'deletedAt', 'uuid', 'history', 'groupRestrictions'],
      ['relevance', 'appliesTo'],
      ['reviewStatus', 'reviewComment'],
      ['reference1', 'break1Repr', 'break1Start', 'break1End'],
      ['reference2', 'break2Repr', 'break2Start', 'break2End'],
      ['source', 'sourceId', 'sourceIdVersion'],
      ['startYear', 'completionYear'],
      ['city', 'country'],
      ['out', 'in'],
    ],
    isEmbedded: false,
    modelName: null,
    onDelete: null,
    onSubmit: null,
    onValueChange: null,
    value: {},
    variant: FORM_VARIANT.VIEW,
  };

  constructor(props) {
    super(props);
    const { value } = this.props;

    this.state = {
      content: value || {},
      errors: {},
      collapseOpen: false,
    };
  }

  componentDidMount() {
    const { variant, value } = this.props;
    const { content } = this.state;

    if (variant === FORM_VARIANT.NEW && !content[CLASS_MODEL_PROP]) {
      const model = this.currentModel();

      if (model && !model.isAbstract) {
        const newContent = Object.assign({}, content, { [CLASS_MODEL_PROP]: model.name });
        this.setState({ content: newContent });
      }
    }
    this.populateFromRecord(value || {});
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      value, modelName, actionInProgress, variant,
    } = this.props;
    const { content, collapseOpen, errors } = this.state;

    if (jc.stringify(value) !== jc.stringify(nextProps.value)
      || modelName !== nextProps.modelName
      || jc.stringify(content) !== jc.stringify(nextState.content)
      || actionInProgress !== nextProps.actionInProgress
      || collapseOpen !== nextState.collapseOpen
      || variant !== nextProps.variant
      || jc.stringify(errors) !== jc.stringify(nextState.errors)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Trigger the state change if a new initial value is passed in
   */
  componentDidUpdate(prevProps) {
    const { value, modelName, variant } = this.props;

    if (!value || !modelName) {
      return;
    }
    const { content } = this.state;

    if (jc.stringify(value) !== jc.stringify(prevProps.value)) {
      this.populateFromRecord(value);
    } else if (modelName !== prevProps.modelName) {
      this.populateFromRecord({ [CLASS_MODEL_PROP]: modelName });
    } else if (
      Object.keys(value).length > 1 // more than just class name
      && modelName === prevProps.modelName // same type of record
      && jc.stringify(value) !== jc.stringify(content)
      && variant !== FORM_VARIANT.NEW
      && variant !== prevProps.variant // only populate when the view type has changed
    ) {
      // this is to populate the content when the user clicks the submit changes button to redirect from edit to view or similar
      this.populateFromRecord(value);
    }
  }

  /**
   * Fill out the form fields using some initial record
   */
  populateFromRecord(record) {
    const { variant } = this.props;

    const model = this.currentModel(record['@class']);

    if (!model) {
      this.setState({ content: {}, errors: {} });
      return;
    }

    // do we need to update the model?
    const newContent = {};
    const errors = {};

    Object.values(model.properties).forEach((prop) => {
      const rawValue = record[prop.name];
      const { value, error } = validateValue(prop, rawValue, variant === FORM_VARIANT.SEARCH);
      newContent[prop.name] = value;
      if (error) {
        errors[prop.name] = error;
      }
    });

    this.setState({ content: newContent, errors });
  }

  /**
   * Based on the model name that was input or the model
   * name (class) that was selected returns the corresonding
   * class model from the schema
   *
   * @param {string} newModelName incoming model name to use if given
   */
  currentModel(newModelName = '') {
    const { schema } = this.context;
    const { content } = this.state;
    const { modelName } = this.props;

    if (newModelName) {
      return schema.get(newModelName);
    } if (content && content['@class']) {
      return schema.get(content);
    } if (modelName) {
      return schema.get(modelName);
    }
    return null;
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
  handleClassChange(event) {
    const { onValueChange, name } = this.props;

    // add the new value to the field
    const propName = event.target.name || event.target.getAttribute('name'); // name of the form field triggering the event

    const newContent = { [propName]: event.target.value || undefined };

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

  /**
   * Handler for the user opening the expandable section of less
   * important or optional fields
   */
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
    const { variant, actionInProgress } = this.props;
    const { content, errors } = this.state;

    const model = this.currentModel();
    if (!model) {
      return [];
    }
    const { properties: { out, in: tgt, ...properties } } = model;

    // get the form content
    const fields = [];

    ordering.forEach((item) => {
      if (item instanceof Array) { // subgrouping
        const key = item.join('--');
        const subgroup = this.renderFieldGroup(item);
        if (subgroup.length) {
          fields.push((
            <div key={key} className="record-form__content-subgroup">
              {subgroup}
            </div>
          ));
        }
      } else if (properties[item]) {
        const prop = properties[item];
        const { name } = prop;
        const wrapper = (
          <FormField
            model={prop}
            value={content[name]}
            error={errors[name]}
            onValueChange={this.handleValueChange}
            schema={schema}
            variant={variant}
            key={name}
            disabled={(
              variant === FORM_VARIANT.VIEW
              || actionInProgress
              || (variant === FORM_VARIANT.EDIT && model.isEdge)
            )}
          />
        );
        fields.push(wrapper);
      }
    });
    return fields;
  }

  /**
   * Renders the two edge specific input fields (out/in)
   */
  renderEdgeFields() {
    const { schema } = this.context;
    const { content, errors } = this.state;
    const { variant, actionInProgress } = this.props;

    const model = this.currentModel();

    return (
      <React.Fragment key="relationship-content">
        <FormField
          error={errors.out || ''}
          onValueChange={this.handleValueChange}
          model={{
            description: 'The source record for the relationship',
            linkedClass: schema.get(model.sourceModel || 'V'),
            name: 'out',
            type: 'link',
            mandatory: true,
            nullable: false,
          }}
          schema={schema}
          value={content.out}
          disabled={variant === FORM_VARIANT.VIEW
            || actionInProgress
            || variant === FORM_VARIANT.EDIT}
          variant={variant}
          label="Source Record (out)"
        />
        <FormField
          error={errors.in || ''}
          onValueChange={this.handleValueChange}
          model={{
            linkedClass: schema.get(model.targetModel || 'V'),
            description: 'The target record for the relationship',
            name: 'in',
            type: 'link',
            mandatory: true,
            nullable: false,
          }}
          schema={schema}
          value={content.in}
          disabled={variant === FORM_VARIANT.VIEW
            || actionInProgress
            || variant === FORM_VARIANT.EDIT}
          variant={variant}
          label="Target Record (in)"
        />
      </React.Fragment>
    );
  }

  render() {
    const {
      aboveFold,
      actionInProgress,
      belowFold,
      className,
      collapseExtra,
      groups,
      isEmbedded,
      modelName,
      onDelete,
      onSubmit,
      value,
      variant,
    } = this.props;
    const { schema } = this.context;
    const {
      content,
      errors,
      collapseOpen,
    } = this.state;

    let model = this.currentModel();

    const isEdge = model && model.isEdge;
    if (model && model.isAbstract && [FORM_VARIANT.SEARCH, FORM_VARIANT.NEW].includes(variant)) {
      model = null;
    }

    const edges = isEmbedded || isEdge
      ? []
      : schema.getEdges(value || {});
    const isStatement = model && model.name === 'Statement';

    const modelChoices = [];
    if (modelName) {
      modelChoices.push(
        ...schema.get(modelName).descendantTree(true).map(m => ({
          label: m.name, value: m.name, key: m.name, caption: m.description,
        })),
      );
      modelChoices.sort((a, b) => a.label.localeCompare(b.label));
    } else if (content && content[CLASS_MODEL_PROP] && !schema.get(content).isAbstract) {
      modelChoices.push(content[CLASS_MODEL_PROP]);
    } else if (variant === FORM_VARIANT.NEW || variant === FORM_VARIANT.SEARCH) {
      modelChoices.push(
        ...schema.get('V').descendantTree(true).map(m => ({
          label: m.name, value: m.name, key: m.name, caption: m.description,
        })),
      );
      modelChoices.sort((a, b) => a.label.localeCompare(b.label));
    }

    const { extraFields, fields } = sortAndGroupFields(model, {
      aboveFold, belowFold, collapseExtra, variant, groups,
    });

    let disableClassSelect = false;
    let defaultClassSelected = '';

    if (modelName && !schema.get(modelName).isAbstract) {
      defaultClassSelected = modelName;
    }

    if (variant === FORM_VARIANT.VIEW) {
      disableClassSelect = true;
    } else if (variant === FORM_VARIANT.SEARCH || variant === FORM_VARIANT.NEW) {
      if (isEmbedded) {
        disableClassSelect = false;
      } else if (modelName && !schema.get(modelName).isAbstract) {
        disableClassSelect = true;
      }
    } else {
      disableClassSelect = true;
    }

    // Select the class model to build the rest of the form
    const classSelect = (
      <FormField
        model={Object.assign(
          {},
          model
            ? model.properties[CLASS_MODEL_PROP]
            : {},
          { choices: modelChoices, required: true, name: CLASS_MODEL_PROP },
        )}
        value={content && content[CLASS_MODEL_PROP]
          ? content[CLASS_MODEL_PROP]
          : defaultClassSelected}
        error={errors[CLASS_MODEL_PROP]}
        onValueChange={this.handleClassChange}
        disabled={disableClassSelect || modelChoices.length < 2}
        schema={schema}
        className="record-form__class-select"
      />
    );

    return (
      <div className={`record-form ${className}`}>
        <div className="record-form__content record-form__content--long">
          {classSelect}
          {isStatement && variant !== FORM_VARIANT.EDIT && variant !== FORM_VARIANT.SEARCH && (
            <React.Fragment key="statement-content">
              <StatementSentence
                schema={schema}
                content={content}
              />
            </React.Fragment>
          )}
          {isEdge && this.renderEdgeFields()}
        </div>
        <div className="record-form__content">
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
              <div className="record-form__content">
                {model && this.renderFieldGroup(extraFields)}
              </div>
            </Collapse>
          </>
        )}
        {!isEmbedded && (
          <div className="record-form__action-buttons">
            {onDelete && variant === FORM_VARIANT.EDIT && variant !== FORM_VARIANT.VIEW
              ? (
                <ActionButton
                  onClick={() => this.handleAction(onDelete)}
                  variant="outlined"
                  size="large"
                  message="Are you sure you want to delete this record?"
                  disabled={actionInProgress}
                >
                  DELETE
                </ActionButton>
              )
              : (<div />) // for spacing issues only
            }
            {actionInProgress && (
              <CircularProgress size={50} />
            )}
            {onSubmit && variant !== FORM_VARIANT.VIEW && (variant !== FORM_VARIANT.EDIT || !isEdge)
              ? (
                <ActionButton
                  onClick={() => this.handleAction(onSubmit)}
                  variant="contained"
                  color="primary"
                  size="large"
                  requireConfirm={false}
                  disabled={actionInProgress}
                >
                  {variant === FORM_VARIANT.EDIT
                    ? 'SUBMIT CHANGES'
                    : 'SUBMIT'
                  }
                </ActionButton>
              )
              : (<div />) // for spacing issues only
            }
          </div>
        )}
        {!isEmbedded && variant === FORM_VARIANT.VIEW && edges.length > 0 && (
          <div className="record-form__related-nodes">
            <Typography variant="h6" component="h2">
              Related Nodes
            </Typography>
            <EdgeTable
              values={edges}
              sourceNodeId={content['@rid']}
              schema={schema}
            />
          </div>
        )}
      </div>
    );
  }
}

export default BaseRecordForm;
