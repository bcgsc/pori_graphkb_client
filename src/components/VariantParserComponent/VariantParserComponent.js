
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
import _ from 'lodash';
import kbp from 'knowledgebase-parser';
import FormTemplater from '../FormTemplater/FormTemplater';
import api from '../../services/api';
import util from '../../services/util';

class VariantParserComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      invalidFlag: '',
      variant: null,
      positionalVariantSchema: null,
      errorFields: [],
    };
    this.parseString = this.parseString.bind(this);
    this.refreshOptions = this.refreshOptions.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
    this.updateShorthand = this.updateShorthand.bind(this);
  }

  async componentDidMount() {
    const schema = await api.getSchema();
    const positionalVariantSchema = (util.getClass('PositionalVariant', schema)).properties;
    const variant = util.initModel({}, positionalVariantSchema);
    console.log(util.initModel({}, positionalVariantSchema));
    this.setState({
      positionalVariantSchema,
      variant,
      schema,
    });
  }

  /**
   * Calls api with user input value as parameter.
   * @param {Event} e - user input event.
   */
  refreshOptions(e) {
    this.setState({ invalidFlag: '' });
    this.parseString(e.target.value);
  }

  /**
   * Queries the api endpoint specified in the component props. Matches records
   * with the property specified in component props similar to the input value.
   * @param {string} value - value to be sent to the api.
   */
  async parseString(value) {
    const { variant, positionalVariantSchema, schema } = this.state;
    try {
      const response = kbp.variant.parse(value.trim());
      // Split response into link data and non-link data
      const linkProps = Object.values(positionalVariantSchema)
        .filter(prop => prop.type === 'link');

      linkProps.forEach(async (prop) => {
        const { name, linkedClass } = prop;
        if (response[name] && linkedClass && linkedClass.route) {
          const data = await api.get(`${linkedClass.route}?name=${response[name]}`);
          const cycled = jc.retrocycle(data).result;
          if (cycled.length === 1) {
            variant[name] = cycled[0].name;
            variant[`${name}.@rid`] = cycled[0]['@rid'];
            this.setState({ variant });
          } else if (cycled.length > 1) {
            // add multiple modals?
          } else if (cycled.length === 0) {
            this.setState({
              invalidFlag: `Referenced ${name} term '${response[name]}' not found`,
            });
          }
        }
      });

      const nestProps = Object.values(positionalVariantSchema)
        .filter(prop => prop.type === 'embedded');

      nestProps.forEach((prop) => {
        const { name } = prop;
        if (response[name] && response[name]['@class']) {
          (util.getClass(response[name]['@class'], schema)).properties
            .forEach((classProp) => {
              response[name][classProp.name] = response[name][classProp.name] === undefined
                || response[name][classProp.name] === null
                ? '' : response[name][classProp.name];
            });
        }
      });
      const newV = Object.assign(variant, _.omit(response, ...linkProps.map(prop => prop.name)));
      this.setState({ variant: newV });
    } catch (error) {
      Object.keys((error.content && error.content.parsed) || {}).forEach((key) => {
        if (variant[key] !== undefined && variant[key] !== null) {
          variant[key] = error.content.parsed[key];
        }
      });
      this.setState({
        variant,
        invalidFlag: error.message,
        errorFields: [],
      });
    }
  }

  /**
   * Handles changes in an embedded property's class.
   * @param {Event} e - new class selection event.
   * @param {string} nested - nested property key.
   */
  handleClassChange(e, nested) {
    const { schema, variant, positionalVariantSchema } = this.state;
    const { name, value } = e.target;
    variant[nested][name] = value;
    const newClass = util.getClass(value, schema).properties;
    if (newClass) {
      const abstractClass = positionalVariantSchema
        .find(p => p.name === nested).linkedClass.name;
      const varKeys = positionalVariantSchema
        .filter(p => p.linkedClass && p.linkedClass.name === abstractClass)
        .map(p => p.name);
      varKeys.forEach((key) => {
        newClass.forEach((prop) => {
          if (variant[key]['@class']) {
            variant[key]['@class'] = value;
            if (!variant[key][prop.name]) {
              variant[key][prop.name] = '';
            }
          }
        });
      });
    } else {
      variant[nested] = { '@class': '' };
    }

    this.setState({ variant }, this.updateShorthand);
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
    } else {
      variant[name] = value;
    }

    Object.keys(e.target)
      .filter(k => k !== 'name' && k !== 'value' && !k.startsWith('_'))
      .forEach((key) => {
        if (nested) {
          variant[nested][`${name}.${key}`] = e.target[key];
        }
        variant[`${name}.${key}`] = e.target[key];
      });

    this.setState({ variant }, this.updateShorthand);
  }

  updateShorthand() {
    const { variant } = this.state;
    const { handleChange, name } = this.props;
    let shorthand = '';
    try {
      const filteredVariant = {};
      Object.keys(variant).forEach((k) => {
        if (typeof variant[k] === 'object') {
          if (variant[k]['@class']) {
            filteredVariant[k] = variant[k];
            filteredVariant.prefix = kbp.position.CLASS_PREFIX[variant[k]['@class']];
          }
        } else if (k !== 'prefix') {
          filteredVariant[k] = variant[k];
        }
      });
      shorthand = new kbp.variant.VariantNotation(filteredVariant);
      const newShorthand = kbp.variant.parse(shorthand.toString());
      handleChange({ target: { value: newShorthand.toString(), name } });
      this.setState({ invalidFlag: '' }, () => this.parseString(newShorthand.toString()));
    } catch (error) {
      // Error.field(s) ?
      console.log(shorthand.toString());
      this.setState({
        invalidFlag: error.message,
        errorFields: [],
      });
      handleChange({ target: { value: shorthand.toString(), name } });
    }
  }

  /**
   * Submits a POST request to the server with current variant data.
   */
  async submitVariant() {
    const { variant, positionalVariantSchema } = this.state;
    Object.keys(variant).forEach((k) => {
      if (typeof variant[k] === 'object' && !variant[k]['@class']) {
        delete variant[k];
      }
    });
    const payload = util.parsePayload(variant, positionalVariantSchema);
    await api.post('/positionalvariants', payload);
  }

  render() {
    const {
      invalidFlag,
      variant,
      positionalVariantSchema,
      schema,
      errorFields,
    } = this.state;
    const {
      required,
      error,
      name,
      value,
      disabled,
      handleChange,
    } = this.props;

    const sortFields = (a, b) => {
      const order = [
        'type',
        'reference1',
        'reference2',
        'break1Start',
        'break1End',
        'break2Start',
        'break2End',
      ];
      if (order.indexOf(b.name) === -1) {
        return -1;
      }
      if (order.indexOf(a.name) === -1) {
        return 1;
      }
      if (order.indexOf(a.name) < order.indexOf(b.name)) {
        return -1;
      }
      return 1;
    };

    return (
      <div className="variant-parser-wrapper">
        <Paper elevation={4} className="variant-parser-shorthand paper">
          <FormControl
            error={!!((error || invalidFlag) && value)}
            fullWidth
          >
            <TextField
              error={!!((error || invalidFlag) && value)}
              required={required}
              name={name}
              onChange={(e) => { handleChange(e); this.refreshOptions(e); }}
              label="HGVS nomenclature"
              disabled={disabled}
              value={value}
            />
            {((error || invalidFlag) && value)
              && <FormHelperText>{invalidFlag}</FormHelperText>
            }
          </FormControl>
        </Paper>
        <Paper elevation={4} className="paper parser-form-grid">
          {schema
            && (
              <FormTemplater
                schema={schema}
                onChange={this.handleVariantChange}
                onClassChange={this.handleClassChange}
                model={variant}
                kbClass={positionalVariantSchema}
                excludedProps={['break1Repr', 'break2Repr']}
                errorFields={errorFields}
                sort={sortFields}
                groups={{
                  break1: ['break1Start', 'break1End'],
                  break2: ['break2Start', 'break2End'],
                }}
              />
            )
          }
        </Paper>
        <Paper className="paper" elevation={4} id="variant-form-submit">
          <Button
            color="primary"
            variant="raised"
            onClick={this.submitVariant}
          >
            Submit
          </Button>
        </Paper>
      </div>
    );
  }
}

VariantParserComponent.propTypes = {
  /**
   * @param {string} name - name of input for event parsing.
   */
  name: PropTypes.string.isRequired,
  /**
   * @param {string} value - specified value for two way binding.
   */
  value: PropTypes.string,
  /**
   * @param {bool} required - required flag for text input indicator.
   */
  required: PropTypes.bool,
  /**
   * @param {bool} error - error flag for text input.
   */
  error: PropTypes.bool,
  /**
   * @param {bool} disabled - disabled flag for text input.
   */
  disabled: PropTypes.bool,
  /**
   * @param {function} handleChange - function for passing state upwards on
   * change of shorthand string.
   */
  handleChange: PropTypes.func.isRequired,
};

VariantParserComponent.defaultProps = {
  value: '',
  required: false,
  error: false,
  disabled: false,
};

export default VariantParserComponent;
