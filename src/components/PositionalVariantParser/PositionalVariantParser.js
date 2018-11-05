/**
 * @module /components/PositionalVariantParser
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './PositionalVariantParser.css';
import {
  TextField,
  Button,
  FormControl,
  FormHelperText,
  Paper,
  ListItem,
} from '@material-ui/core';
import * as jc from 'json-cycle';
import kbp from 'knowledgebase-parser';
import NotificationDrawer from '../NotificationDrawer/NotificationDrawer';
import RelationshipsForm from '../RelationshipsForm/RelationshipsForm';
import FormTemplater from '../FormTemplater/FormTemplater';
import api from '../../services/api';
import util from '../../services/util';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';

const DEFAULT_ORDER = [
  'type',
  'reference1',
  'break1Start',
  'break1End',
  'reference2',
  'break2Start',
  'break2End',
];

const SHORTHAND_EXCLUDED = [
  'germline',
  'zygosity',
];

class PositionalVariantParser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shorthand: '',
      invalidFlag: '',
      variant: null,
      errorFields: [],
      relationships: [],
      originalRelationships: [],
      nodeClass: 'PositionalVariant',
    };
    this.parseString = this.parseString.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
    this.updateErrorFields = this.updateErrorFields.bind(this);
    this.extractLinkProps = this.extractLinkProps.bind(this);
    this.updateShorthand = this.updateShorthand.bind(this);
  }

  componentDidMount() {
    const { schema, initVariant } = this.props;
    const { nodeClass } = this.state;
    const variant = initVariant
      ? schema.initModel(initVariant, initVariant['@class'])
      : schema.initModel({}, nodeClass);

    const relationships = [];
    if (initVariant && initVariant.getEdges) {
      initVariant.getEdges().forEach((edge) => {
        relationships.push(schema.initModel(edge, edge['@class']));
      });
    }

    const shorthand = initVariant ? initVariant.getPreview() : '';
    this.setState({
      variant,
      shorthand,
      relationships,
      originalRelationships: relationships.slice(),
    });
  }

  /**
   * Parses shorthand string and updates form fields with response.
   * @param {Event} e - user input event.
   */
  async parseString(e) {
    const { variant } = this.state;
    const { schema } = this.props;
    const { value } = e.target;
    this.setState({ shorthand: value });
    const { properties } = schema.getClass('PositionalVariant');
    if (!value) {
      const newVariant = schema.initModel({}, 'PositionalVariant');
      Object.keys(newVariant).forEach((k) => {
        if (typeof newVariant[k] === 'object' && newVariant[k]['@class']) {
          newVariant[k]['@class'] = '';
        }
      });
      this.setState({
        variant: newVariant,
        errorFields: [],
        invalidFlag: null,
      });
    } else {
      try {
        const response = kbp.variant.parse(value.trim());
        // Split response into link data and non-link data
        const linkProps = await this.extractLinkProps(response);
        const embeddedProps = util.getPropOfType(properties, 'embedded');

        embeddedProps.forEach((prop) => {
          const { name } = prop;
          if (response[name] && response[name].name) {
            schema.getClass(response[name].name).properties
              .forEach((classProp) => {
                response[name][classProp.name] = response[name][classProp.name] === undefined
                  || response[name][classProp.name] === null
                  ? '' : response[name][classProp.name];
              });
            response[name]['@class'] = response[name].name;
          } else {
            response[name] = { '@class': '' };
          }
        });
        const newVariant = Object.assign(schema.initModel(variant, 'PositionalVariant'),
          { ...response, ...linkProps.props });
        this.setState({
          variant: newVariant,
          invalidFlag: linkProps.invalidFlag,
          errorFields: linkProps.errorFields,
        });
      } catch (error) {
        let invalidFlag = '';
        let newVariant = variant;
        let newErrorFields = [];
        if (error.content && error.content.parsed) {
          Object.keys(error.content.parsed).forEach((key) => {
            if (variant[key] !== undefined && variant[key] !== null) {
              variant[key] = error.content.parsed[key];
            }
          });
          const linkProps = await this.extractLinkProps(error.content.parsed);
          ({ invalidFlag } = linkProps);
          newVariant = Object.assign(variant, linkProps.props);
          newErrorFields = linkProps.errorFields;
        }

        this.setState({
          invalidFlag: error.message || invalidFlag,
          errorFields: this.updateErrorFields(error, newErrorFields),
          variant: newVariant,
        });
      }
    }
  }

  /**
   * Validates link properties by checking the database for exact matches.
   * Returns a sub-object of PositionalVariant containing the fields in need of
   * update, with their validated properties.
   * @param {Object} parsed - Parsed variant from kbp.
   */
  async extractLinkProps(parsed) {
    const { schema } = this.props;
    const classSchema = schema.getClass('PositionalVariant').properties;
    const linkProps = util.getPropOfType(classSchema, 'link');
    const newValues = {};
    let invalidFlag = '';
    const errorFields = [];
    await Promise.all(linkProps.map(async (prop) => {
      const { name, linkedClass } = prop;
      if (parsed[name] && linkedClass && linkedClass.route) {
        const data = await api.get(`${linkedClass.route}?name=${parsed[name]}`);
        const cycled = jc.retrocycle(data).result;
        if (cycled.length === 1) {
          newValues[name] = cycled[0].name;
          newValues[`${name}.@rid`] = cycled[0]['@rid'];
        } else if (cycled.length > 1) {
          // add multiple modals?
        } else if (cycled.length === 0) {
          errorFields.push(name);
          invalidFlag = `Referenced ${name} term '${parsed[name]}' not found`;
        }
      }
    }));

    return { props: newValues, invalidFlag, errorFields };
  }

  /**
   * Handles changes in an embedded property's class.
   * @param {Event} e - new class selection event.
   * @param {string} nested - nested property key.
   */
  handleClassChange(e, nested) {
    const { variant } = this.state;
    const { schema } = this.props;
    const { value } = e.target;
    const classSchema = schema.getClass('PositionalVariant').properties;
    if (schema.getClass(value)) {
      const abstractClass = classSchema
        .find(p => p.name === nested).linkedClass.name;
      const varKeys = classSchema
        .filter(p => p.linkedClass && p.linkedClass.name === abstractClass)
        .map(p => p.name);
      varKeys.forEach((key) => {
        if ((variant[key]['@class'] && variant[key]['@class'] !== value)
          || (key === nested && !variant[key]['@class'])) {
          variant[key] = schema.initModel({}, value);
        }
      });
    } else {
      variant[nested] = { '@class': '' };
    }
    this.updateShorthand(variant);
  }

  handleChange(e) {
    const { variant } = this.state;
    const { schema } = this.props;
    const { name, value } = e.target;
    const update = { [name]: value };
    if (name === 'nodeClass') {
      update.variant = schema.initModel(variant, value);
    }

    this.setState(update);
  }

  /**
   * Fired whenever the variant form fields (excluding the shorthand input) are
   * modified.
   * @param {Event} e - user input event
   * @param {string} nested - nested property key
   */
  handleVariantChange(e, nested) {
    const { variant } = this.state;
    const { schema } = this.props;
    const { name, value } = e.target;
    if (nested) {
      variant[nested][name] = value;
      if (name.includes('.data') && value) {
        variant[nested][name.split('.')[0]] = schema.newRecord(value).getPreview();
      }
    } else {
      variant[name] = value;
      if (name.includes('.data') && value) {
        variant[name.split('.')[0]] = schema.newRecord(value).getPreview();
      }
    }
    if (!SHORTHAND_EXCLUDED.includes(name)) {
      this.updateShorthand(variant);
    } else {
      this.setState({ variant, errorFields: [] });
    }
  }

  /**
   * Pipes changes of the variant form fields to the shorthand string form.
   */
  updateShorthand(variant) {
    let { shorthand } = this.state;
    const { schema } = this.props;
    try {
      const filteredVariant = {};
      Object.keys(variant).forEach((k) => {
        if (variant[k] && typeof variant[k] === 'object') {
          if (variant[k]['@class'] && schema.isPosition(variant[k]['@class'])) {
            filteredVariant[k] = variant[k];
            filteredVariant.prefix = kbp.position.CLASS_PREFIX[variant[k]['@class']];
          }
        } else if (k !== 'prefix' && variant[k]) {
          filteredVariant[k] = variant[k];
        }
      });
      shorthand = new kbp.variant.VariantNotation(filteredVariant);
      if (shorthand.break1Repr) {
        variant.break1Repr = shorthand.break1Repr;
      }
      if (shorthand.break2Repr) {
        variant.break2Repr = shorthand.break2Repr;
      }
      shorthand = kbp.variant.parse(shorthand.toString());
      this.setState({
        invalidFlag: '',
        shorthand: shorthand.toString(),
        variant,
        errorFields: [],
      });
    } catch (error) {
      this.setState({
        shorthand: shorthand.toString(),
        invalidFlag: error.message,
        variant,
        errorFields: this.updateErrorFields(error, []),
      });
    }
  }

  /**
   * Assigns blame to violatedAttr input fields in the form.
   * @param {kbp.error.ErrorMixin} error - Error object from kbp.
   */
  updateErrorFields(error, errorFields) {
    const { variant } = this.state;
    if (error && error.content) {
      const { violatedAttr } = error.content;
      if (violatedAttr) {
        if (violatedAttr === 'break1' || violatedAttr === 'break2') {
          if (variant[`${violatedAttr}Start`]) {
            errorFields.push(`${violatedAttr}Start`);
          }
          if (variant[`${violatedAttr}End`]) {
            errorFields.push(`${violatedAttr}End`);
          }
        } else if (variant[violatedAttr] !== undefined) {
          errorFields.push(violatedAttr);
        }
      }
    }
    return errorFields;
  }

  /**
   * Opens notification drawer and triggers parent submit component.
   * @param {Event} e - submit button click event.
   */
  /* eslint-disable */
  async submitVariant(e) {
    e.preventDefault();
    this.setState({ loading: true, notificationDrawerOpen: true });
    const { variant, relationships, originalRelationships } = this.state;
    const { handleSubmit } = this.props;
    await handleSubmit(variant, relationships, originalRelationships);
    this.setState({ loading: false });
  }

  render() {
    const {
      shorthand,
      invalidFlag,
      variant,
      errorFields,
      notificationDrawerOpen,
      loading,
      relationships,
      nodeClass,
    } = this.state;
    const {
      required,
      error,
      disabled,
      schema,
      handleFinish,
      initVariant,
    } = this.props;

    if (!variant) return null;
    const classSchema = schema.getClass(nodeClass).properties;
    const isPositional = nodeClass === 'PositionalVariant';
    let formIsInvalid = !!(invalidFlag && isPositional);
    (classSchema || []).forEach((prop) => {
      if (prop.mandatory) {
        if (prop.type === 'link' && (!variant[`${prop.name}.data`] || !variant[`${prop.name}.data`]['@rid'])) {
          formIsInvalid = true;
        } else if (prop.type !== 'boolean' && !variant[prop.name]) {
          formIsInvalid = true;
        }
      }
    });
    const shorthandError = !!(error || invalidFlag);

    return (
      <div className="variant-parser-wrapper">
        <NotificationDrawer
          open={notificationDrawerOpen}
          handleFinish={handleFinish}
          loading={loading}
        />
        <div className="flexbox">
          <div className="variant-parser">

            <Paper elevation={4} className="variant-parser-shorthand">
              <ListItem>
                <ResourceSelectComponent
                  resources={['PositionalVariant', 'CategoryVariant']}
                  name="nodeClass"
                  value={nodeClass}
                  onChange={this.handleChange}
                  label="Class"
                />
              </ListItem>
              {isPositional && (
                <ListItem>
                  <FormControl
                    error={shorthandError}
                    fullWidth
                  >
                    <TextField
                      error={shorthandError}
                      required={required}
                      name="shorthand"
                      onChange={this.parseString}
                      label="HGVS Nomenclature"
                      disabled={disabled}
                      value={shorthand}
                    />
                    {shorthandError
                      && <FormHelperText>{invalidFlag}</FormHelperText>
                    }
                  </FormControl>
                </ListItem>
              )}
            </Paper>
            <Paper elevation={4} className="parser-form-grid">
              {schema
                && (
                  <FormTemplater
                    schema={schema}
                    onChange={this.handleVariantChange}
                    onClassChange={this.handleClassChange}
                    model={variant}
                    propSchemas={classSchema}
                    excludedProps={['break1Repr', 'break2Repr']}
                    errorFields={isPositional ? errorFields : []}
                    sort={util.sortFields(DEFAULT_ORDER)}
                    pairs={{
                      break1: ['break1Start', 'break1End'],
                      break2: ['break2Start', 'break2End'],
                      untemplated: ['untemplatedSeq', 'untemplatedSeqSize'],
                    }}
                  />
                )
              }
            </Paper>
          </div>
          <Paper elevation={4} className="variant-relationships">
            <RelationshipsForm
              relationships={relationships}
              name="relationships"
              onChange={this.handleChange}
              schema={schema}
              nodeRid={initVariant ? initVariant['@rid'] : undefined}
            />
          </Paper>
        </div>
        <Paper elevation={4} id="variant-form-submit">
          <Button
            onClick={this.submitVariant}
            color="primary"
            variant="contained"
            disabled={formIsInvalid}
          >
            Submit
          </Button>
        </Paper>
      </div>
    );
  }
}

/**
 * @namespace
 * @property {bool} required - required flag for text input indicator.
 * @property {bool} error - error flag for text input.
 * @property {bool} disabled - disabled flag for text input.
 * @property {function} handleFinish - function for handling form finishing.
 * @property {function} handleSubmit - function for handling form submission.
 * @property {Object} schema - Knowledgebase schema object.
 */
PositionalVariantParser.propTypes = {
  required: PropTypes.bool,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  handleFinish: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func,
  schema: PropTypes.object.isRequired,
  initVariant: PropTypes.object,
};

PositionalVariantParser.defaultProps = {
  initVariant: null,
  required: false,
  error: false,
  disabled: false,
  handleSubmit: () => { },
};

export default PositionalVariantParser;
