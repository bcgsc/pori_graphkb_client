/**
 * @module /components/AutoSearchMulti
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  MenuItem,
  Typography,
  IconButton,
  Popover,
  Paper,
  CardContent,
  CardActions,
  Button,
  Tooltip,
  ListItem,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import * as qs from 'querystring';
import debounce from 'lodash.debounce';

import ResourceSelectComponent from '../ResourceSelectComponent';
import AutoSearchBase from '../AutoSearchBase';
import FormTemplater from '../FormTemplater/FormTemplater';
import api from '../../services/api';
import util from '../../services/util';
import './AutoSearchMulti.scss';

const DEBOUNCE_TIME = 300;

// More conservative timeout for double query call.
const LONG_DEBOUNCE_TIME = 600;

const ACTION_KEYCODES = [13, 16, 37, 38, 39, 40];
const EXTRA_FORM_PROPS = ['@rid'];

/**
 * Autosearch component meant for a wide range of possible classes and/or
 * endpoints. Main use is in relationships target selector fields and
 * dependency link properties.
 *
 * @property {object} props
 * @property {string} props.name - name of input for event parsing.
 * @property {string} props.value - specified value for two way binding.
 * @property {function} props.onChange - parent method for handling change events
 * @property {number} props.limit - database return record limit.
 * @property {string} props.endpoint - api endpoint identifier.
 * @property {string} props.property - api property identifier.
 * @property {string} props.placeholder - placeholder for text input.
 * @property {string} props.label - label for text input.
 * @property {bool} props.required - required flag for text input indicator.
 * @property {bool} props.error - error flag for text input.
 * @property {bool} props.disabled - disabled flag for text input.
 * @property {Record} props.selected - Last selected record.
 * @property {Object} props.schema - Knowledgebase schema object.
 */
class AutoSearchMulti extends Component {
  static propTypes = {
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
    schema: PropTypes.object,
    superClass: PropTypes.string,
  };

  static defaultProps = {
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
    schema: null,
    superClass: '',
  };

  constructor(props) {
    super(props);
    this.state = {
      options: [],
      loading: false,
      anchorEl: null,
      cls: '',
      model: null,
      downshiftOpen: false,
    };
    const { property } = props;
    this.callApi = debounce(
      this.callApi.bind(this),
      property.length > 1 ? LONG_DEBOUNCE_TIME : DEBOUNCE_TIME,
    );
    this.setRef = (node) => { this.popperNode = node; };
  }

  /**
   * Initializes temp model for querying.
   */
  componentDidMount() {
    const { schema } = this.props;
    const { cls } = this.state;
    this.setState({ model: schema.initModel({}, cls, { extraProps: EXTRA_FORM_PROPS }) || {} });
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
  @boundMethod
  handleBlur() {
    this.setState({ loading: false, options: [], downshiftOpen: false });
  }

  /**
   * Updates the parent value with value from a selected item.
   * @param {Object} selectedRecord - Selected KB record.
   */
  @boundMethod
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
    this.setState({ downshiftOpen: false });
  }

  /**
   * Opens/closes popover, and closes downshift component.
   * @param {Event} event - Popover event.
   */
  @boundMethod
  handleOpenPopover(event) {
    this.setState({ anchorEl: event ? event.currentTarget : null, downshiftOpen: false });
  }

  /**
   * Sends query to api using the temp model as the set of query parameters.
   */
  @boundMethod
  async handleQuery() {
    const { model, cls } = this.state;
    const { schema } = this.props;
    const pattern = new RegExp(/[\s:\\;,./+*=!?[\]()]+/, 'gm');

    const properties = schema.getQueryProperties(cls, EXTRA_FORM_PROPS);
    const payload = util.parsePayload(model, properties, [], true);
    Object.keys(payload).forEach((k) => {
      const trimmed = String(payload[k]).trim();
      if (!trimmed.split(pattern).some(chunk => chunk.length < 4)) {
        payload[k] = `~${trimmed}`;
      } else {
        payload[k] = trimmed;
      }
    });

    this.setState({
      options: [],
      loading: true,
      anchorEl: null,
      downshiftOpen: true,
    });

    try {
      const call = api.get(`${schema.get(cls).routeName}?${qs.stringify(payload)}&neighbors=3&limit=30`);
      const { result } = await call.request();

      this.setState({
        options: result,
        loading: false,
        model: schema.initModel({}, cls, { extraProps: EXTRA_FORM_PROPS }) || {},
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  /**
   * Handles the update of the model class by reinitializing model and changing
   * class state variable.
   * @param {Event} event - New class select event.
   */
  @boundMethod
  handleClassChange(event) {
    const { schema } = this.props;
    const { model } = this.state;
    this.setState({
      cls: event.target.value,
      model: schema.initModel(model, event.target.value, { extraProps: EXTRA_FORM_PROPS }),
    });
  }

  /**
   * Emits a null value to the "[name].data" key name of parent component. This
   * convention represents an unselected value for link properties.
   */
  @boundMethod
  handleClear() {
    const { name, onChange } = this.props;
    onChange({ target: { value: null, name: `${name}.data` } });
  }

  /**
   * Calls api with user input value as parameter.
   * @param {Event} event - user input event.
   */
  @boundMethod
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
      this.setState({ loading: true, downshiftOpen: true });
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
      const call = api.autoSearch(
        endpoint,
        property,
        value,
        limit,
      );
      const result = await call.request();

      this.setState({ options: result, loading: false });
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
      downshiftOpen,
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
      endpoint,
      superClass,
    } = this.props;

    const TextFieldProps = {
      name,
      placeholder,
      label,
      required,
      disabled,
      error,
      InputProps: {
        onBlur: this.handleBlur,
      },
    };
    const DownshiftProps = { isOpen: downshiftOpen };

    const endAdornment = (
      <Tooltip title="Additional Query Parameters">
        <div>
          <IconButton
            onClick={this.handleOpenPopover}
            disabled={!!selected || disabled}
            className="popover-open-btn"
          >
            <OpenInNewIcon />
          </IconButton>
        </div>
      </Tooltip>
    );

    const properties = schema.getQueryProperties(cls, EXTRA_FORM_PROPS) || [];
    const endpointName = superClass || (
      Object
        .values(schema.schema)
        .find(ml => ml.routeName === endpoint) || {}
    ).name;
    return (
      <>
        <AutoSearchBase
          options={options}
          value={value}
          selected={selected}
          loading={loading}
          TextFieldProps={TextFieldProps}
          DownshiftProps={DownshiftProps}
          onChange={this.refreshOptions}
          onClear={this.handleClear}
          onSelect={this.handleChange}
          endAdornment={endAdornment}
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
                {schema.getPreview(item)}
                <Typography color="textSecondary" variant="body1">
                  {item.source && item.source.name ? item.source.name : ''}
                </Typography>
              </span>
            </MenuItem>
          )}
        </AutoSearchBase>
        <Popover
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => this.handleOpenPopover(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionProps={{ unmountOnExit: true }}
          PaperProps={{
            style: {
              overflow: 'visible',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            },
          }}
        >
          <div className="autosearch-multi-popover">
            <Paper elevation={20}>
              <CardContent>
                <ListItem>
                  <ResourceSelectComponent
                    value={cls}
                    onChange={this.handleClassChange}
                    fullWidth
                    label="Class"
                    resources={
                      (endpointName
                        ? schema.getSubclassesOf(endpointName)
                        : schema.getQueryable()
                      ).map(m => m.name)}
                  />
                </ListItem>
                {model && (
                  <div className="autosearch-multi-form-templater">
                    <FormTemplater
                      schema={schema}
                      model={model}
                      appendToKeys={cls}
                      propSchemas={properties}
                      disabledFields={model['@rid']
                        ? properties.map(p => p.name).filter(p => p !== '@rid')
                        : undefined}
                      sort={util.sortFields(EXTRA_FORM_PROPS)}
                      dense
                      ignoreRequired
                      onChange={(e, nested) => {
                        if (nested) {
                          model[nested][e.target.name] = e.target.value;
                        } else {
                          model[e.target.name] = e.target.value;
                        }
                        this.setState({ model });
                      }}
                    />
                  </div>
                )}
              </CardContent>
              <CardActions className="query-btn">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.handleQuery}
                >
                  Query
                </Button>
              </CardActions>
            </Paper>
          </div>
        </Popover>
      </>
    );
  }
}

export default AutoSearchMulti;
