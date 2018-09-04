
/**
 * @module /components/VariantParserComponent
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './VariantParserComponent.css';
import {
  TextField,
} from '@material-ui/core';
import * as jc from 'json-cycle';
import _ from 'lodash';
import FormTemplater from '../FormTemplater/FormTemplater';
import api from '../../services/api';
import util from '../../services/util';

const DEBOUNCE_TIME = 300;

class VariantParserComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      invalidFlag: false,
      variant: null,
      positionalVariantSchema: null,
    };
    this.callApi = _.debounce(this.callApi.bind(this), DEBOUNCE_TIME);
    this.refreshOptions = this.refreshOptions.bind(this);
    this.handleLinkedProp = this.handleLinkedProp.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);
  }

  async componentDidMount() {
    const schema = await api.getSchema();
    const positionalVariantSchema = (await api.getClass('PositionalVariant')).properties;
    const variant = util.initModel({}, positionalVariantSchema);
    console.log(util.initModel({}, positionalVariantSchema));
    const positions = Object.keys(schema)
      .filter(s => schema[s].inherits.includes('Position'))
      .map(s => schema[s]);
    console.log(positions);
    this.setState({
      positionalVariantSchema,
      variant,
      schema,
    }, () => console.log(variant));
    this.callApi(this.props.value);
  }

  /**
   * Cancels debounce method to avoid memory leaks.
   */
  componentWillUnmount() {
    this.callApi.cancel();
    this.render = null;
  }

  /**
   * Calls api with user input value as parameter.
   * @param {Event} e - user input event.
   */
  refreshOptions(e) {
    this.setState({ invalidFlag: false });
    this.callApi(e.target.value);
  }

  /**
   * Queries the api endpoint specified in the component props. Matches records
   * with the property specified in component props similar to the input value.
   * @param {string} value - value to be sent to the api.
   */
  async callApi(value) {
    try {
      const { variant } = this.state;
      const response = jc.retrocycle(await api.variantParse(value)).result;
      const newV = Object.assign(variant, response);
      this.setState({ variant: newV });
    } catch (error) {
      console.log(error);
      this.setState({
        invalidFlag: true,
      });
    }
  }

  handleLinkedProp(e) {
    const { variant } = this.state;
    const name = e.target.name.split('.');
    if (name.length === 2) {
      variant[name[0]][name[1]] = e.target.value;
    }
    this.setState({ variant }, () => console.log(this.state.variant));
  }

  handleVariantChange(e, nested) {
    const { variant } = this.state;
    const { name, value } = e.target;
    if (nested) {
      variant[nested][name] = value;
    }
    variant[name] = value;

    console.log(e.target)
    Object.keys(e.target).filter(k => k !== 'name' && k !== 'value' && !k.startsWith('_')).forEach((key) => {
      if (nested) {
        variant[nested][`${name}.${key}`] = e.target[key];
      }
      variant[`${name}.${key}`] = e.target[key];
    });
    console.log(variant);
    this.setState({ variant });
  }

  render() {
    const {
      invalidFlag,
      variant,
      positionalVariantSchema,
      schema,
    } = this.state;
    const {
      label,
      required,
      error,
      name,
      value,
      disabled,
      // dense,
      placeholder,
      handleChange,
    } = this.props;

    return (
      <div>
        <div className="variant-parser-wrapper">
          <TextField
            fullWidth
            error={error || invalidFlag}
            label={label}
            required={required}
            name={name}
            onChange={(e) => { handleChange(e); this.refreshOptions(e); }}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
          />
        </div>
        <div className="paper">
          {schema
            && (
              <FormTemplater
                schema={schema}
                onChange={this.handleVariantChange}
                model={variant}
                kbClass={positionalVariantSchema}
              />
            )
          }
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
