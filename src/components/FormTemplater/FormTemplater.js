import React from 'react';
import PropTypes from 'prop-types';
import './FormTemplater.css';
import {
  ListItem,
  FormControl,
  FormLabel,
  FormControlLabel,
  TextField,
  RadioGroup,
  Radio,
  InputAdornment,
  Tooltip,
  MenuItem,
  Typography,
} from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import AutoSearchSingle from '../AutoSearchSingle/AutoSearchSingle';
import AutoSearchMulti from '../AutoSearchMulti/AutoSearchMulti';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import EmbeddedSetForm from '../EmbeddedSetForm/EmbeddedSetForm';
import util from '../../services/util';

/**
 * Templater component that generates input form fields based off of a given
 * schema and binds them to a given model.
 */
function FormTemplater(props) {
  const {
    appendToKeys,
    model,
    propSchemas,
    schema,
    onChange,
    onClassChange,
    excludedProps,
    fieldComponent,
    errorFields,
    disabledFields,
    sort,
    pairs,
    ignoreRequired,
    disablePadding,
    disablePortal,
    disableLists,
  } = props;
  const fields = [];
  const formatFormField = (property) => {
    if (!property) return null;
    const {
      name,
      type,
      linkedClass,
      description,
      choices,
      min,
      max,
    } = property;
    const mandatory = property.mandatory && !ignoreRequired;
    // Radio group component for boolean types.
    if (type === 'boolean') {
      // If boolean property is not present on the model, initialize it as
      // neither true nor false, otherwise use the value of the model.
      const boolValue = model[name] === undefined || model[name] === null ? '' : model[name];
      return (
        <ListItem
          component={fieldComponent}
          key={`${appendToKeys}.${name}`}
          disableGutters={disablePadding}
        >
          <FormControl
            component="fieldset"
            required={mandatory}
            error={errorFields.includes(name)}
            disabled={disabledFields.includes(name)}
          >
            <FormLabel>
              {util.antiCamelCase(name)}
            </FormLabel>
            <RadioGroup
              name={name}
              onChange={e => onChange(e)}
              value={boolValue.toString()}
              style={{ flexDirection: 'row' }}
            >
              <FormControlLabel value="true" control={<Radio />} label="Yes" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
          {description && (
            <Tooltip title={description}>
              <HelpIcon color="primary" className="form-templater-help-icon radio" />
            </Tooltip>
          )}
        </ListItem>
      );
    }
    if (type === 'link') {
      // If type is a link to another record, must find that record in the
      // database and store its rid.

      // Decide which endpoint to query.
      let endpoint;
      if (linkedClass) {
        endpoint = linkedClass.routeName.slice(1);
        return (
          <ListItem
            className="form-templater-autosearch"
            component={fieldComponent}
            key={`${appendToKeys}.${name}`}
            disableGutters={disablePadding}
          >
            <AutoSearchSingle
              error={errorFields.includes(name)}
              disabled={disabledFields.includes(name)}
              value={model[name]}
              selected={model[`${name}.data`]}
              onChange={onChange}
              name={name}
              label={util.antiCamelCase(name)}
              limit={30}
              endpoint={endpoint}
              required={mandatory}
              property={!linkedClass ? ['name', 'sourceId'] : undefined}
              disablePortal={disablePortal}
              schema={schema}
              endAdornment={description ? (
                <Tooltip title={description}>
                  <HelpIcon color="primary" style={{ cursor: 'default' }} />
                </Tooltip>
              ) : undefined}
            />
          </ListItem>
        );
      }
      return (
        <ListItem
          className="form-templater-autosearch"
          component={fieldComponent}
          key={`${appendToKeys}.${name}`}
          disableGutters={disablePadding}
        >
          <AutoSearchMulti
            error={errorFields.includes(name)}
            disabled={disabledFields.includes(name)}
            value={model[name]}
            selected={model[`${name}.data`]}
            onChange={onChange}
            name={name}
            label={util.antiCamelCase(name)}
            schema={schema}
            required={mandatory}
          />
        </ListItem>
      );
    }
    if (type === 'embedded') {
      const properties = schema.getProperties((model[name] || {})['@class']);
      let classSelector = (
        <Typography variant="subtitle1">
          {util.antiCamelCase(name)}
        </Typography>
      );
      const handleClassChange = onClassChange || onChange;
      if (linkedClass.isAbstract) {
        classSelector = (
          <ResourceSelectComponent
            name="@class"
            onChange={e => handleClassChange(e, name)}
            required={mandatory}
            resources={[{ name: '' }, ...linkedClass.subclasses]}
            label={`${util.antiCamelCase(name)} Class`}
            value={(model[name] || { '@class': '' })['@class']}
            error={errorFields.includes(name)}
            disabled={disabledFields.includes(name)}
          >
            {resource => (
              <MenuItem key={resource.name} value={resource.name}>
                {util.antiCamelCase(resource.name || 'None')}
              </MenuItem>
            )}
          </ResourceSelectComponent>
        );
      }
      return (
        <ListItem
          component={fieldComponent}
          key={`${appendToKeys}.${name}`}
          disableGutters={disablePadding}
        >
          <div className="form-templater-embedded-selector">
            {classSelector}
            {description && (
              <Tooltip title={description}>
                <HelpIcon color="primary" className="form-templater-help-icon" />
              </Tooltip>
            )}
          </div>
          <FormTemplater
            onChange={e => onChange(e, name)}
            schema={schema}
            propSchemas={properties || []}
            model={model[name] || {}}
            excludedProps={['@class']}
            fieldComponent="div"
            errorFields={errorFields.map(errorField => errorField.replace(`${name}.`, ''))}
            pairs={pairs}
            ignoreRequired={ignoreRequired}
            disabled={disabledFields.includes(name)}
          />
        </ListItem>
      );
    }
    if (type === 'embeddedset' && !disableLists) {
      return (
        <ListItem
          component={fieldComponent}
          key={`${appendToKeys}.${name}`}
          disableGutters={disablePadding}
        >
          <EmbeddedSetForm
            list={model[name]}
            onChange={onChange}
            name={name}
            label={util.antiCamelCase(name)}
            error={errorFields.includes(name)}
            disabled={disabledFields.includes(name)}
          />
        </ListItem>
      );
    }
    if (choices) {
      return (
        <ListItem
          component={fieldComponent}
          key={`${appendToKeys}.${name}`}
          disableGutters={disablePadding}
        >
          <ResourceSelectComponent
            name={name}
            required={mandatory}
            onChange={e => onChange(e)}
            resources={[...choices, '']}
            label={util.antiCamelCase(name)}
            value={model[name] || ''}
            error={errorFields.includes(name)}
            disabled={disabledFields.includes(name)}
          >
            {resource => (
              <MenuItem key={resource} value={resource}>
                {util.antiCamelCase(resource) || 'None'}
              </MenuItem>
            )}
          </ResourceSelectComponent>
        </ListItem>
      );
    }


    // For text fields, apply some final changes for number inputs.
    let t;
    let step;
    if (type === 'string') {
      t = 'text';
    } else if (type === 'integer') {
      t = 'number';
      step = 1;
    } else if (type === 'long') {
      t = 'number';
    }

    const invalid = () => {
      let range = false;
      if (t === 'number') {
        if (min) {
          range = !range && model[name] < min;
        }
        if (max) {
          range = !range && model[name] > max;
        }
      }
      return errorFields.includes(name) || range;
    };

    /* eslint-disable react/jsx-no-duplicate-props */
    return (
      <ListItem
        component={fieldComponent}
        key={`${appendToKeys}.${name}`}
        disableGutters={disablePadding}
      >
        <TextField
          style={{ width: '100%' }}
          label={util.antiCamelCase(name)}
          value={model[name]}
          onChange={onChange}
          name={name}
          required={mandatory}
          multiline={t === 'text'}
          error={invalid() && !ignoreRequired}
          disabled={disabledFields.includes(name)}
          InputProps={{
            endAdornment: description && (
              <InputAdornment position="end">
                <Tooltip title={description}>
                  <HelpIcon color="primary" style={{ cursor: 'default' }} />
                </Tooltip>
              </InputAdornment>
            ),

          }}
          inputProps={{
            type: t || '',
            step: step || '',
            min: min || undefined,
            max: max || undefined,
          }}
        />
      </ListItem>
    );
  };

  const completedpairs = {};
  const sortedProps = Object.values(propSchemas || {})
    .filter(p => !excludedProps.includes(p.name))
    .sort(sort);

  sortedProps.forEach((property) => {
    Object.keys(pairs).forEach((key) => {
      if (
        pairs[key].includes(property.name)
        && !Object.values(completedpairs).some(g => g.includes(property.name))
      ) {
        const isHalf = pairs[key].filter(k => sortedProps.find(p => p.name === k)).length === 1;
        if (isHalf) {
          fields.push(pairs[key]
            .filter(k => sortedProps.find(p => p.name === k))
            .map(k => formatFormField(sortedProps.find(p => p.name === k))));
        } else {
          fields.push((
            <ListItem
              key={`${appendToKeys}.${key}`}
              component="div"
              className="form-templater-group-wrapper"
              id={key}
              disableGutters={disablePadding}
            >
              <div className="form-templater-row-grid">
                {pairs[key].map(k => formatFormField(sortedProps.find(p => p.name === k)))}
              </div>
            </ListItem>
          ));
        }
        completedpairs[key] = pairs[key].slice();
      }
    });
    if (!Object.values(completedpairs).some(g => g.includes(property.name))) {
      fields.push(formatFormField(property));
    }
  });
  return fields;
}

/**
 * @namespace
 * @property {Object} schema - Knowledgebase db schema.
 * @property {function} onChange - Model updating function
 * @property {function} onClassChange - Function for updating embedded prop
 * classes.
 * @property {Object} model - Model object.
 * @property {Array.<Object>} propSchemas - Form object schema.
 * @property {Array.<string>} excludedProps - List of prop strings to be
 * excluded from form generation.
 * @property {string} fieldComponent - Component to pass to material UI ListItem
 * component
 * @property {Array.<string>} errorFields - list of field keys that are causing errors in
 * parent component.
 * @property {Array.<string>} disabledFields - list of field keys that should be disabled.
 * @property {function} sort - Sorting function for form fields.
 * @property {Object} pairs - group definitions for grid.
 * @property {boolean} ignoreRequired - if true, form does not apply required
 * state to mandatory fields.
 * @property {boolean} disablePadding - if true, disables left and right padding
 * in ListItems.
 * @property {boolean} disablePortal - if true, disables portals for nested
 * autosearch components.
 */
FormTemplater.propTypes = {
  schema: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClassChange: PropTypes.func,
  model: PropTypes.object.isRequired,
  propSchemas: PropTypes.any,
  excludedProps: PropTypes.array,
  fieldComponent: PropTypes.string,
  errorFields: PropTypes.array,
  disabledFields: PropTypes.array,
  sort: PropTypes.func,
  pairs: PropTypes.object,
  ignoreRequired: PropTypes.bool,
  disablePadding: PropTypes.bool,
  disablePortal: PropTypes.bool,
};

FormTemplater.defaultProps = {
  excludedProps: [],
  propSchemas: {},
  onClassChange: null,
  fieldComponent: 'li',
  errorFields: [],
  disabledFields: [],
  sort: () => 0,
  pairs: {},
  ignoreRequired: false,
  disablePadding: false,
  disablePortal: false,
  disableLists: false,
};

export default FormTemplater;
