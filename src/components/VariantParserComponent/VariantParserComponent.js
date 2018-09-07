
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
} from '@material-ui/core';
import * as jc from 'json-cycle';
import _ from 'lodash';
import kbp from 'knowledgebase-parser';
import FormTemplater from '../FormTemplater/FormTemplater';
import api from '../../services/api';
import util from '../../services/util';

const DEBOUNCE_TIME = 300;

class VariantParserComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      invalidFlag: '',
      variant: null,
      positionalVariantSchema: null,
    };
    this.parseString = _.debounce(this.parseString.bind(this), DEBOUNCE_TIME);
    this.refreshOptions = this.refreshOptions.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);
    this.onClassChange = this.onClassChange.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
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
    }, () => console.log(variant));
  }

  /**
   * Cancels debounce method to avoid memory leaks.
   */
  componentWillUnmount() {
    this.parseString.cancel();
    this.render = null;
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
    const { variant, positionalVariantSchema } = this.state;
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
            console.log();
            this.setState({
              invalidFlag: `Referenced ${name} term '${response[name]}' not found`,
            });
          }
        }
      });
      const newV = Object.assign(variant, _.omit(response, ...linkProps.map(prop => prop.name)));
      this.setState({ variant: newV });
    } catch (error) {
      this.setState({
        variant, invalidFlag: error.message,
      });
    }
  }

  /**
   * Handles changes in an embedded property's class.
   * @param {Event} e - new class selection event.
   * @param {string} nested - nested property key.
   */
  onClassChange(e, nested) {
    const { schema, variant } = this.state;
    const { name, value } = e.target;
    variant[nested][name] = value;
    const newClass = util.getClass(value, schema).properties;
    if (newClass) {
      newClass.forEach(prop => {
        if (!variant[prop.name]) {
          variant[nested][prop.name] = '';
        }
      });
    } else {
      variant[nested] = { '@class': '' };
    }

    this.setState({ variant });
  }

  /**
   * Fired whenever the variant form fields (excluding the shorthand input) are
   * modified. 
   * @param {Event} e - user input event
   * @param {string} nested - nested property key
   */
  handleVariantChange(e, nested) {
    const { handleChange } = this.props;
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
    try {
      const filteredVariant = {};
      Object.keys(variant).forEach((k) => {
        if (typeof variant[k] === 'object') {
          if (variant[k]['@class']) {
            filteredVariant[k] = variant[k];
          }
        } else {
          filteredVariant[k] = variant[k];
        }
      });
      console.log(filteredVariant)
      const shorthand = new kbp.variant.VariantNotation(filteredVariant);
      const newShorthand = kbp.variant.parse(shorthand.toString());
      handleChange({ target: { value: newShorthand.toString(), name: 'name' } });
      this.setState({ invalidFlag: '' });
    } catch (error) {
      this.setState({ invalidFlag: error.message });
    }
    this.setState({ variant });
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
    const payload = util.parsePayload(variant, positionalVariantSchema)
    const response = await api.post('/positionalvariants', payload);
    console.log(response);
  }

  render() {
    const {
      invalidFlag,
      variant,
      positionalVariantSchema,
      schema,
    } = this.state;
    const {
      required,
      error,
      name,
      value,
      disabled,
      handleChange,
    } = this.props;

    return (
      <div>
        <div className="variant-parser-wrapper paper">

          <FormControl
            error={!!(error || invalidFlag) && value}
            fullWidth
          >
            <TextField
              error={!!(error || invalidFlag) && value}
              required={required}
              name={name}
              onChange={(e) => { handleChange(e); this.refreshOptions(e); }}
              label={'HGVS nomenclature'}
              disabled={disabled}
              value={value}
            />
            {(error || invalidFlag) && value
              && <FormHelperText>{invalidFlag}</FormHelperText>
            }
          </FormControl>
        </div>
        <div className="paper parser-form-grid">
          {schema
            && (
              <FormTemplater
                schema={schema}
                onChange={this.handleVariantChange}
                onClassChange={this.onClassChange}
                model={variant}
                kbClass={positionalVariantSchema}
              />
            )
          }
        </div>
        <div>
          <Button
            color="primary"
            variant="raised"
            onClick={this.submitVariant}
          >
            Submit
          </Button>
        </div>
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
   * @param {string} placeholder - placeholder for text input.
   */
  placeholder: PropTypes.string,
  /**
   * @param {string} value - specified value for two way binding.
   */
  value: PropTypes.string,
  /**
   * @param {string} label - label for text input.
   */
  label: PropTypes.string,
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
   * @param {bool} dense - dense variant flag. If true, font sizes are decreased.
   */
  // dense: PropTypes.bool,
  handleChange: PropTypes.func.isRequired,
};

VariantParserComponent.defaultProps = {
  placeholder: '',
  value: '',
  label: '',
  required: false,
  error: false,
  // dense: false,
  disabled: false,
};

export default VariantParserComponent;
