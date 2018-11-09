/**
 * @module /components/AutoSearchMulti
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  MenuItem,
  Typography,
  IconButton,
  Popover,
  CardContent,
  CardActions,
  Button,
  Tooltip,
  Select,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import * as jc from 'json-cycle';
import debounce from 'lodash.debounce';
import AutoSearchBase from '../AutoSearchBase/AutoSearchBase';
import FormTemplater from '../FormTemplater/FormTemplater';
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
 */
class AutoSearchMulti extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      loading: false,
      anchorEl: null,
      cls: 'Ontology',
      model: null,
    };
    const { property } = props;
    this.callApi = debounce(
      this.callApi.bind(this),
      property.length > 1 ? LONG_DEBOUNCE_TIME : DEBOUNCE_TIME,
    );
    this.handleChange = this.handleChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleOpenPopover = this.handleOpenPopover.bind(this);
    this.refreshOptions = this.refreshOptions.bind(this);
    this.setRef = (node) => { this.popperNode = node; };
  }

  componentDidMount() {
    const { schema } = this.props;
    const { cls } = this.state;
    this.setState({ model: schema.initModel({}, cls) });
  }

  /**
   * Cancels debounce method to avoid memory leaks.
   */
  componentWillUnmount() {
    this.callApi.cancel();
    this.render = null;
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

  handleOpenPopover(e) {
    this.setState({ anchorEl: e ? e.currentTarget : null });
  }

  handleClassChange(e) {
    const { schema } = this.props;
    const { model } = this.state;
    this.setState({ cls: e.target.value, model: schema.initModel(model, e.target.value) });
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
   * @param {Event} e - user input event.
   */
  refreshOptions(e) {
    if (!ACTION_KEYCODES.includes(e.keyCode)) {
      const { selected } = this.state;
      const { value: propValue, onChange } = this.props;
      const { value, name } = e.target;
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
      anchorEl,
      cls,
      model,
    } = this.state;

    const {
      name,
      placeholder,
      value,
      label,
      required,
      disabled,
      error,
      selected,
      schema,
    } = this.props;

    const TextFieldProps = {
      name,
      placeholder,
      label,
      required,
      disabled,
      error,
    };

    const endAdornment = (
      <Tooltip title="Additional Query Parameters">
        <div>
          <IconButton onClick={this.handleOpenPopover} disabled={!!selected}>
            <OpenInNewIcon />
          </IconButton>
        </div>
      </Tooltip>
    );

    const { properties, route } = schema.getClass(cls);
    const excludedProps = properties.map(p => p.name)
      .filter(p => !schema.getClassConstructor(cls).getIdentifiers().find(id => id.split('.')[0] === p));

    return (
      <React.Fragment>
        <Popover
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => this.handleOpenPopover(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <div>
            <CardContent>
              <Select
                value={cls}
                onChange={this.handleClassChange}
              >
                <MenuItem value="Ontology">Ontology</MenuItem>
                <MenuItem value="Variant">Variant</MenuItem>
                <MenuItem value="Statement">Statement</MenuItem>
              </Select>
              {route}
              {model && (
                <FormTemplater
                  schema={schema}
                  model={model}
                  propSchemas={properties}
                  excludedProps={excludedProps}
                  onChange={(e) => {
                    model[e.target.name] = e.target.value;
                    this.setState({ model });
                  }}
                />)}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
              >
                Query
              </Button>
            </CardActions>
          </div>
        </Popover>
        <AutoSearchBase
          options={options}
          value={value}
          selected={selected}
          loading={loading}
          TextFieldProps={TextFieldProps}
          onChange={this.refreshOptions}
          onClear={this.handleClear}
          onSelect={this.handleChange}
          endAdornment={endAdornment}
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
      </React.Fragment>
    );
  }
}

/**
 * @namespace
 * @property {string} name - name of input for event parsing.
 * @property {string} value - specified value for two way binding.
 * @property {function} onChange - parent method for handling change events
 * @property {number} limit - database return record limit.
 * @property {string} endpoint - api endpoint identifier.
 * @property {string} property - api property identifier.
 * @property {string} placeholder - placeholder for text input.
 * @property {string} label - label for text input.
 * @property {bool} required - required flag for text input indicator.
 * @property {bool} error - error flag for text input.
 * @property {function} children - Function that yields the component for
 * display display query results.
 * @property {bool} disabled - disabled flag for text input.
 * @property {Object} endAdornment - component to adorn the end of input text
 * field with.
 * @property {Record} selected - Last selected record.
 */
AutoSearchMulti.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  limit: PropTypes.number,
  endpoint: PropTypes.string,
  property: PropTypes.array,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  selected: PropTypes.object,
  schema: PropTypes.object,
};

AutoSearchMulti.defaultProps = {
  limit: 30,
  endpoint: 'ontologies',
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
  schema: null,
};

export default AutoSearchMulti;
