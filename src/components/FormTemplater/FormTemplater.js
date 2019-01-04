import React from 'react';
import PropTypes from 'prop-types';
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

import './FormTemplater.scss';
import AutoSearchSingle from '../AutoSearchSingle';
import AutoSearchMulti from '../AutoSearchMulti';
import ResourceSelectComponent from '../ResourceSelectComponent';
import EmbeddedSetForm from '../EmbeddedSetForm';
import util from '../../services/util';

/**
 * Templater component that generates input form fields based off of a given
 * schema and binds them to a given model.
 * @property {Object} props.schema - Knowledgebase db schema.
 * @property {function} props.onChange - Model updating function
 * @property {function} props.onClassChange - Function for updating embedded prop classes.
 * @property {Object} props.model - Model object.
 * @property {Array.<Object>} props.propSchemas - Form object schema.
 * @property {Array.<string>} props.excludedProps - List of prop strings to be
 * excluded from form generation.
 * @property {string} props.fieldComponent - Component to pass to material UI ListItem component
 * @property {Array.<string>} props.errorFields - list of field keys that are causing errors in
 * parent component.
 * @property {Array.<string>} props.disabledFields - list of field keys that should be disabled.
 * @property {function} props.sort - Sorting function for form fields.
 * @property {Object} props.pairs - group definitions for grid.
 * @property {boolean} props.ignoreRequired - if true, form does not apply required
 * state to mandatory fields.
 * @property {boolean} props.disablePadding - if true, disables left and right padding in ListItems.
 * @property {boolean} props.disablePortal - if true, disables portals for nested
 * autosearch components.
 */
const FormTemplater = (props) => {
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
    let field;

    const wrapperProps = {
      component: fieldComponent,
      key: `${appendToKeys}.${name}`,
      disableGutters: disablePadding,
      className: 'form-templater-item',
    };
    // Radio group component for boolean types.
    if (type === 'boolean') {
      // If boolean property is not present on the model, initialize it as
      // neither true nor false, otherwise use the value of the model.
      const boolValue = model[name] === undefined || model[name] === null ? '' : model[name];
      field = (
        <React.Fragment>
          <div className="form-templater-radio-wrapper">
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
          </div>
        </React.Fragment>
      );
    } else if (type === 'link') {
      // If type is a link to another record, must find that record in the
      // database and store its rid.

      // Decide which endpoint to query.
      let endpoint;
      wrapperProps.className = 'form-templater-autosearch';
      if (linkedClass) {
        endpoint = linkedClass.routeName.slice(1);
        field = (
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
        );
      } else {
        field = (
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
        );
      }
    } else if (type === 'embedded') {
      const properties = schema.getProperties(model[name]);
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
      field = (
        <React.Fragment>
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
        </React.Fragment>
      );
    } else if (type === 'embeddedset' && !disableLists) {
      field = (
        <EmbeddedSetForm
          list={model[name]}
          onChange={onChange}
          name={name}
          label={util.antiCamelCase(name)}
          error={errorFields.includes(name)}
          disabled={disabledFields.includes(name)}
        />
      );
    } else if (choices) {
      field = (
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
      );
    } else {
      // For text fields, apply some final changes for number inputs.
      const typeCast = { string: 'text', integer: 'number', long: 'number' };
      const t = typeCast[type];
      let step;
      if (type === 'integer' || type === 'long') {
        step = 1;
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

      field = (
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
            type: t || '',
            step: step || '',
            min: min || undefined,
            max: max || undefined,
          }}
        />
      );
    }

    return (
      <ListItem {...wrapperProps}>
        {field}
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
};

FormTemplater.propTypes = {
  schema: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClassChange: PropTypes.func,
  model: PropTypes.object.isRequired,
  propSchemas: PropTypes.array,
  excludedProps: PropTypes.arrayOf(PropTypes.string),
  fieldComponent: PropTypes.string,
  errorFields: PropTypes.arrayOf(PropTypes.string),
  disabledFields: PropTypes.arrayOf(PropTypes.string),
  sort: PropTypes.func,
  pairs: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
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
