/**
 * @module /components/AutoSearchSingle
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  MenuItem,
  Typography,
} from '@material-ui/core';
import * as jc from 'json-cycle';
import debounce from 'lodash.debounce';
import AutoSearchBase from '../AutoSearchBase';
import api from '../../services/api';

const DEBOUNCE_TIME = 300;

// More conservative timeout for double query call.
const LONG_DEBOUNCE_TIME = 600;

const ACTION_KEYCODES = [13, 16, 37, 38, 39, 40];

/**
 * Autosearch component meant for querying a single property of a single route.
 * Best suited for ontologies, or classes with a single easily searchable
 * property.
 *
 * When used for forms, component will emit the currently typed string with the
 * target name of the input "name" prop, and will emit the selected item with
 * the target name "[name].data".
 * @property {object} props
 * @property {string} props.name - name of input for event parsing.
 * @property {string} props.value - specified value for two way binding.
 * @property {function} props.onChange - parent method for handling change events
 * @property {number} props.limit - database return record limit.
 * @property {string} props.endpoint - api endpoint identifier.
 * @property {Array.<string>} props.property - api property identifier.
 * @property {string} props.placeholder - placeholder for text input.
 * @property {string} props.label - label for text input.
 * @property {boolean} props.required - required flag for text input indicator.
 * @property {boolean} props.error - error flag for text input.
 * @property {function} props.children - Function that yields the component for
 * display display query results.
 * @property {bool} props.disabled - disabled flag for text input.
 * @property {Object} props.endAdornment - component to adorn the end of input text
 * field with.
 * @property {Record} props.selected - Last selected record.
 */
class AutoSearchSingle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      loading: false,
    };
    const { property } = props;
    this.callApi = debounce(
      this.callApi.bind(this),
      property.length > 1 ? LONG_DEBOUNCE_TIME : DEBOUNCE_TIME,
    );
    this.handleChange = this.handleChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.refreshOptions = this.refreshOptions.bind(this);
    this.setRef = (node) => { this.popperNode = node; };
  }

  /**
   * Cancels debounce method to avoid memory leaks.
   */
  componentWillUnmount() {
    this.callApi.cancel();
    this.render = null;
  }

  static get propTypes() {
    return {
      className: PropTypes.string,
      name: PropTypes.string,
      value: PropTypes.string,
      onChange: PropTypes.func,
      limit: PropTypes.number,
      endpoint: PropTypes.string,
      property: PropTypes.arrayOf(PropTypes.string),
      placeholder: PropTypes.string,
      label: PropTypes.string,
      required: PropTypes.bool,
      error: PropTypes.bool,
      disabled: PropTypes.bool,
      selected: PropTypes.object,
      disablePortal: PropTypes.bool,
      schema: PropTypes.object,
      endAdornment: PropTypes.object.isRequired,
    };
  }

  static get defaultProps() {
    return {
      className: '',
      limit: 30,
      endpoint: '/ontologies',
      property: ['name'],
      placeholder: '',
      name: undefined,
      value: undefined,
      label: '',
      required: false,
      error: false,
      selected: null,
      onChange: () => { },
      disabled: false,
      disablePortal: false,
      schema: null,
    };
  }

  /**
   * Clears loading states.
   */
  handleBlur() {
    this.setState({ loading: false, options: [] });
  }

  /**
   * Updates the parent value with value from a selected item.
   * @param {Object} selectedRecord - Selected KB record.
   */
  handleChange(selectedRecord) {
    const {
      onChange,
      name,
    } = this.props;
    onChange({
      target: {
        value: selectedRecord,
        name: `${name}.data`,
      },
    });
  }

  /**
   * Emits a null value to the "[name].data" key name of parent component. This
   * convention represents an unselected value for link properties.
   */
  handleClear() {
    const { name, onChange } = this.props;
    onChange({ target: { value: null, name: `${name}.data` } });
  }

  /**
   * Calls api with user input value as parameter.
   * @param {Event} event - user input event.
   */
  refreshOptions(event) {
    if (!ACTION_KEYCODES.includes(event.keyCode)) {
      const { selected } = this.state;
      const { value: propValue, onChange } = this.props;
      const { value, name } = event.target;
      let val = value;

      if (selected) {
        val = `${propValue}${value}`;
      }
      this.handleChange(null);
      onChange({ target: { name, value: val } });
      this.setState({ loading: true });
      this.callApi(val);
    }
  }

  /**
   * Queries the api endpoint specified in the component props. Matches records
   * with the property specified in component props similar to the input value.
   * @param {string} value - value to be sent to the api.
   */
  async callApi(value) {
    const {
      limit,
      endpoint,
      property,
    } = this.props;
    try {
      const response = await api.autoSearch(
        endpoint,
        property,
        value,
        limit,
      );
      const results = jc.retrocycle(response).result;

      this.setState({ options: results, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  render() {
    const {
      options,
      loading,
    } = this.state;

    const {
      name,
      placeholder,
      value,
      label,
      required,
      disabled,
      endAdornment,
      error,
      selected,
      disablePortal,
      schema,
      className,
    } = this.props;

    const TextFieldProps = {
      name,
      placeholder,
      label,
      required,
      disabled,
      error,
    };

    return (
      <AutoSearchBase
        className={className}
        options={options}
        value={value}
        selected={selected}
        loading={loading}
        TextFieldProps={TextFieldProps}
        onChange={this.refreshOptions}
        onClear={this.handleClear}
        onSelect={this.handleChange}
        endAdornment={endAdornment}
        disablePortal={disablePortal}
        schema={schema}
      >
        {(item, index, downshiftProps) => (
          <MenuItem
            {...downshiftProps.getItemProps({
              key: item['@rid'],
              index,
              item,
            })}
            style={{ whiteSpace: 'normal', height: 'unset' }}
            selected={downshiftProps.highlightedIndex === index}
          >
            <span>
              {item.name || item.sourceId}
              <Typography color="textSecondary" variant="body1">
                {item.source && item.source.name ? item.source.name : ''}
              </Typography>
            </span>
          </MenuItem>
        )}
      </AutoSearchBase>
    );
  }
}


export default AutoSearchSingle;
