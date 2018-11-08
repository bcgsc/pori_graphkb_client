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
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import EmbeddedListForm from '../EmbeddedListForm/EmbeddedListForm';
import util from '../../services/util';

/**
 * Templater component that generates input fields based off of a given schema.
 */
function FormTemplater(props) {
  const {
    model,
    propSchemas,
    schema,
    onChange,
    onClassChange,
    excludedProps,
    fieldComponent,
    errorFields,
    sort,
    pairs,
    ignoreRequired,
    disablePadding,
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
      const bool = model[name] === undefined || model[name] === null ? '' : model[name];
      return (
        <ListItem
          component={fieldComponent}
          key={name}
          disableGutters={disablePadding}
        >
          <FormControl
            component="fieldset"
            required={mandatory}
            error={errorFields.includes(name)}
          >
            <FormLabel>
              {util.antiCamelCase(name)}
            </FormLabel>
            <RadioGroup
              name={name}
              onChange={e => onChange(e)}
              value={bool.toString()}
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
        endpoint = linkedClass.route.slice(1);
      }

      return (
        <ListItem
          className="form-templater-autosearch"
          component={fieldComponent}
          key={name}
          disableGutters={disablePadding}
        >
          <AutoSearchComponent
            error={errorFields.includes(name)}
            value={model[name]}
            selected={schema.newRecord(model[`${name}.data`])}
            onChange={onChange}
            name={name}
            label={util.antiCamelCase(name)}
            limit={30}
            endpoint={endpoint}
            required={mandatory}
            property={!linkedClass ? ['name', 'sourceId'] : undefined}
            endAdornment={description ? (
              <Tooltip title={description}>
                <HelpIcon color="primary" style={{ cursor: 'default' }} />
              </Tooltip>
            ) : undefined}
          />
        </ListItem>
      );
    }
    if (type === 'embedded') {
      const kbClass = (schema.getClass((model[name] || {})['@class']));
      let classSelector = (
        <Typography variant="subtitle1">
          {util.antiCamelCase(name)}
        </Typography>
      );
      const handleClassChange = onClassChange || onChange;
      if (schema.isAbstract(linkedClass.name)) {
        classSelector = (
          <ResourceSelectComponent
            name="@class"
            onChange={e => handleClassChange(e, name)}
            required={mandatory}
            resources={[{ name: '' }, ...schema.getSubClasses(linkedClass.name)]}
            label={`${util.antiCamelCase(name)} Class`}
            value={(model[name] || { '@class': '' })['@class']}
            error={errorFields.includes(name)}
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
          key={name}
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
            propSchemas={kbClass ? kbClass.properties : []}
            model={model[name] || {}}
            excludedProps={['@class']}
            fieldComponent="div"
            errorFields={errorFields.map(errorField => errorField.replace(`${name}.`, ''))}
            pairs={pairs}
            ignoreRequired={ignoreRequired}
          />
        </ListItem>
      );
    }
    if (type === 'embeddedset') {
      return (
        <ListItem
          component={fieldComponent}
          key={name}
          disableGutters={disablePadding}
        >
          <EmbeddedListForm
            list={model[name]}
            onChange={onChange}
            name={name}
            label={util.antiCamelCase(name)}
          />
        </ListItem>
      );
    }
    if (choices) {
      return (
        <ListItem
          component={fieldComponent}
          key={name}
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
        key={name}
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
              key={key}
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
 * @property {Array} propSchemas - Form object schema.
 * @property {Array} excludedProps - List of propstrings to be excluded from
 * generation.
 * @property {string} fieldComponent - Component to pass to material UI ListItem
 * component
 * @property {Array} errorFields - list of field keys that are causing errors in
 * parent component.
 * @property {function} sort - Sorting function for form fields.
 * @property {Object} pairs - group definitions for grid.
 * @property {bool} ignoreRequired - if true, form does not apply required
 * state to mandatory fields.
 * @property {bool} disablePadding - if true, disables left and right padding
 * in ListItems.
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
  sort: PropTypes.func,
  pairs: PropTypes.object,
  ignoreRequired: PropTypes.bool,
  disablePadding: PropTypes.bool,
};

FormTemplater.defaultProps = {
  excludedProps: [],
  propSchemas: {},
  onClassChange: null,
  fieldComponent: 'li',
  errorFields: [],
  sort: () => 0,
  pairs: {},
  ignoreRequired: false,
  disablePadding: false,
};

export default FormTemplater;
