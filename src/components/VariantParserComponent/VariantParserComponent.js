
/**
 * @module /components/VariantParserComponent
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './VariantParserComponent.css';
import {
  TextField,
  Typography,
  IconButton,
} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import * as jc from 'json-cycle';
import _ from 'lodash';
import api from '../../services/api';

const DEBOUNCE_TIME = 300;

class VariantParserComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      invalidFlag: false,
      collapsed: true,
      variant: null,
      positionalVariantSchema: null,
    };
    this.callApi = _.debounce(this.callApi.bind(this), DEBOUNCE_TIME);
    this.refreshOptions = this.refreshOptions.bind(this);
  }

  async componentDidMount() {
    const { V } = await api.getSchema();
    const positionalVariantSchema = (await api.getClass('PositionalVariant')).properties;
    const variant = {};

    Object.values(positionalVariantSchema).forEach((property) => {
      const { name, type, linkedClass } = property;
      if ((type === 'embedded' || type === 'link') && linkedClass) {
        if (!variant[name]) variant[name] = {};
        Object.values(linkedClass.properties)
          .filter(prop => !Object.keys(V.properties).includes(prop.name) || prop.name === '@class')
          .forEach((linkedProperty) => {
            variant[name][linkedProperty.name] = '';
          });
      } else {
        variant[name] = '';
      }
    });
    this.setState({ positionalVariantSchema, variant }, () => console.log(variant));
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
        variant: null,
        collapsed: true,
      });
    }
  }

  render() {
    const {
      invalidFlag,
      collapsed,
      variant,
      positionalVariantSchema,
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

    const positionalVariantDisplay = (
      <ul className="positional-variant-wrapper">
        {Object.values(positionalVariantSchema || {}).map((property) => {
          if (variant[property.name]) {
            const { type, linkedClass } = property;
            if ((type === 'embedded' || type === 'link') && linkedClass) {
              return Object.values(linkedClass.properties)
                .map(linkedProp => variant[property.name][linkedProp.name] !== undefined
                  && (
                    <li key={property.name + linkedProp.name}>
                      <TextField
                        value={variant[property.name][linkedProp.name]}
                        label={`${property.name} ${linkedProp.name}`}
                      />
                    </li>
                  ));
            }
            return (
              <li key={property.name}>
                <TextField
                  value={variant[property.name]}
                  label={property.name}
                />
              </li>
            );
          }
          return null;
        })}
      </ul>
    );

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
          <IconButton
            disabled={disabled || !variant}
            className={!collapsed ? 'variant-parser-collapsed' : ''}
            onClick={() => this.setState({ collapsed: !collapsed })}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </div>
        <div className="paper">
          {positionalVariantDisplay}
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
