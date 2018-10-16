/**
 * @module /components/VariantParserComponent
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './VariantParserComponent.css';
import {
  TextField,
  Button,
  FormControl,
  FormHelperText,
  Paper,
} from '@material-ui/core';
import * as jc from 'json-cycle';
import kbp from 'knowledgebase-parser';
import FormTemplater from '../FormTemplater/FormTemplater';
import api from '../../services/api';
import util from '../../services/util';
import NotificationDrawer from '../NotificationDrawer/NotificationDrawer';

const DEFAULT_ORDER = [
  'type',
  'reference1',
  'break1Start',
  'break1End',
  'reference2',
  'break2Start',
  'break2End',
];

class VariantParserComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shorthand: '',
      invalidFlag: '',
      variant: null,
      classSchema: [],
      errorFields: [],
      schema: null,
    };
    this.parseString = this.parseString.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
    this.updateErrorFields = this.updateErrorFields.bind(this);
    this.extractLinkProps = this.extractLinkProps.bind(this);
    this.updateShorthand = this.updateShorthand.bind(this);
  }

  async componentDidMount() {
    const schema = await api.getSchema();
    const classSchema = (util.getClass('PositionalVariant', schema)).properties;
    const variant = util.initModel({}, classSchema);
    this.setState({
      classSchema,
      variant,
      schema,
    });
  }

  /**
   * Parses shorthand string and updates form fields with response.
   * @param {Event} e - user input event.
   */
  async parseString(e) {
    const { variant, classSchema, schema } = this.state;
    const { value } = e.target;
    this.setState({ shorthand: value });
    if (!value) {
      this.setState({
        variant: util.initModel({}, classSchema),
        errorFields: [],
        invalidFlag: null,
      });
    } else {
      try {
        const response = kbp.variant.parse(value.trim());
        // Split response into link data and non-link data
        const linkProps = await this.extractLinkProps(response);
        const embeddedProps = util.getPropOfType(classSchema, 'embedded');

        embeddedProps.forEach((prop) => {
          const { name } = prop;
          if (response[name] && response[name].name) {
            (util.getClass(response[name].name, schema)).properties
              .forEach((classProp) => {
                variant[name][classProp.name] = response[name][classProp.name] === undefined
                  || response[name][classProp.name] === null
                  ? '' : response[name][classProp.name];
              });
            response[name]['@class'] = response[name].name;
          } else {
            response[name] = { '@class': '' };
          }
        });

        this.setState({
          variant: Object.assign(util.initModel({}, classSchema),
            { ...response, ...linkProps.props }),
          invalidFlag: linkProps.invalidFlag,
          errorFields: linkProps.errorFields,
        });
      } catch (error) {
        let invalidFlag = '';
        if (error.content && error.content.parsed) {
          Object.keys(error.content.parsed).forEach((key) => {
            if (variant[key] !== undefined && variant[key] !== null) {
              variant[key] = error.content.parsed[key];
            }
          });
          const linkProps = await this.extractLinkProps(error.content.parsed);
          ({ invalidFlag } = linkProps);
          this.setState({
            variant: Object.assign(variant, linkProps.props),
            errorFields: linkProps.errorFields,
          });
        }

        this.updateErrorFields(error);
        this.setState({ invalidFlag: error.message || invalidFlag });
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
    const { classSchema } = this.state;
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
    const { schema, variant, classSchema } = this.state;
    const { value } = e.target;
    const newClass = util.getClass(value, schema).properties;
    if (newClass) {
      const abstractClass = classSchema
        .find(p => p.name === nested).linkedClass.name;
      const varKeys = classSchema
        .filter(p => p.linkedClass && p.linkedClass.name === abstractClass)
        .map(p => p.name);
      varKeys.forEach((key) => {
        if ((variant[key]['@class'] && variant[key]['@class'] !== value) || key === nested) {
          variant[key] = util.initModel({ '@class': value }, newClass);
        }
      });
    } else {
      variant[nested] = { '@class': '' };
    }

    this.setState({ variant, errorFields: [] }, this.updateShorthand);
  }

  /**
   * Fired whenever the variant form fields (excluding the shorthand input) are
   * modified.
   * @param {Event} e - user input event
   * @param {string} nested - nested property key
   */
  handleVariantChange(e, nested) {
    const { variant } = this.state;
    const { name, value } = e.target;
    if (nested) {
      variant[nested][name] = value;
      variant[nested][`${name}.@rid`] = e.target['@rid'];
    } else {
      variant[name] = value;
      variant[`${name}.@rid`] = e.target['@rid'];
    }

    Object.keys(e.target)
      .filter(k => k !== 'name' && k !== 'value' && !k.startsWith('_'))
      .forEach((key) => {
        if (nested) {
          variant[nested][`${name}.${key}`] = e.target[key];
        }
        variant[`${name}.${key}`] = e.target[key];
      });
    this.setState({ variant, errorFields: [] }, this.updateShorthand);
  }

  /**
   * Pipes changes of the variant form fields to the shorthand string form.
   */
  updateShorthand() {
    const { variant } = this.state;
    let { shorthand } = this.state;
    try {
      const filteredVariant = {};
      Object.keys(variant).forEach((k) => {
        if (typeof variant[k] === 'object') {
          if (variant[k]['@class']) {
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
      this.setState({ invalidFlag: '' });
    } catch (error) {
      this.updateErrorFields(error);
      this.setState({ invalidFlag: error.message });
    } finally {
      this.setState({ shorthand: shorthand.toString(), variant });
    }
  }

  /**
   * Assigns blame to violatedAttr input fields in the form.
   * @param {kbp.error.ErrorMixin} error - Error object from kbp.
   */
  updateErrorFields(error) {
    const { errorFields, variant } = this.state;
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
    this.setState({ errorFields });
  }

  /**
   * Submits a POST request to the server with current variant data.
   */
  async submitVariant(e) {
    e.preventDefault();
    const { variant, classSchema, schema } = this.state;
    const copy = Object.assign({}, variant);
    Object.keys(copy).forEach((k) => {
      if (typeof copy[k] === 'object') { // more flexible
        if (!copy[k]['@class']) {
          delete copy[k];
        } else {
          const nestedProps = (util.getClass(copy[k]['@class'], schema)).properties;
          nestedProps.forEach((prop) => {
            if (!copy[k][prop.name]) {
              if (prop.type === 'integer' && prop.mandatory) {
                copy[k][prop.name] = Number(copy[k][prop.name]);
              } else {
                delete copy[k][prop.name];
              }
            }
          });
        }
      }
    });
    const payload = util.parsePayload(copy, classSchema);
    this.setState({ loading: true, notificationDrawerOpen: true });
    await api.post('/positionalvariants', payload);
    this.setState({ loading: false });
  }

  render() {
    const {
      shorthand,
      invalidFlag,
      variant,
      classSchema,
      schema,
      errorFields,
      notificationDrawerOpen,
      loading,
    } = this.state;
    const {
      required,
      error,
      disabled,
      handleFinish,
    } = this.props;

    if (!schema) {
      return null;
    }

    let formIsInvalid = false;
    classSchema.forEach((prop) => {
      if (prop.mandatory) {
        if (prop.type === 'link' && (!variant[prop.name] || !variant[`${prop.name}.@rid`])) {
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
        <Paper elevation={4} className="variant-parser-shorthand">
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
        </Paper>
        <Paper elevation={4} className="parser-form-grid">
          {schema
            && (
              <FormTemplater
                schema={schema}
                onChange={this.handleVariantChange}
                onClassChange={this.handleClassChange}
                model={variant}
                kbClass={classSchema}
                excludedProps={['break1Repr', 'break2Repr']}
                errorFields={errorFields}
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
        <Paper elevation={4} id="variant-form-submit">
          <Button
            onClick={this.submitVariant}
            color="primary"
            variant="raised"
            disabled={!!(formIsInvalid || invalidFlag)}
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
 */
VariantParserComponent.propTypes = {
  required: PropTypes.bool,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  handleFinish: PropTypes.func.isRequired,
};

VariantParserComponent.defaultProps = {
  required: false,
  error: false,
  disabled: false,
};

export default VariantParserComponent;
