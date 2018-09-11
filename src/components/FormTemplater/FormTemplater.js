import React, { Component } from 'react';
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
} from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import util from '../../services/util';

/**
 * Templater component that generates input fields based off of a given schema.
 */
class FormTemplater extends Component {
  /**
   * Creates DOM models to be rendered.
   * @param {Object} model - Object to which data will be bound.
   * @param {Object} kbClass - Filtered schema object containing ONLY and ALL classes to be
   * rendered. (Schema.properties)
   */
  render() {
    const {
      model,
      kbClass,
      schema,
      onChange,
      onClassChange,
      excludedProps,
      fieldComponent,
      errorFields,
      sort,
      pairs,
    } = this.props;
    const fields = [];

    const formatFormField = (property) => {
      if (!property) return null;
      const {
        name,
        type,
        mandatory,
        linkedClass,
        description,
        choices,
      } = property;

      // Radio group component for boolean types.
      if (type === 'boolean') {
        return (
          <ListItem component={fieldComponent} key={name}>
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
                value={model[name].toString()}
                style={{ flexDirection: 'row' }}
              >
                <FormControlLabel value="true" control={<Radio />} label="Yes" />
                <FormControlLabel value="false" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
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
          <ListItem component={fieldComponent} key={name}>
            <AutoSearchComponent
              error={errorFields.includes(name)}
              value={model[name]}
              onChange={onChange}
              name={name}
              label={util.antiCamelCase(name)}
              limit={30}
              endpoint={endpoint}
              required={mandatory}
              property={!linkedClass ? ['name', 'sourceId'] : undefined}
            />
          </ListItem>
        );
      }
      if (type === 'embedded') {
        let classSelector = null;
        const handleClassChange = onClassChange || onChange;
        if (util.isAbstract(linkedClass.name, schema)) {
          classSelector = (
            <ResourceSelectComponent
              name="@class"
              onChange={e => handleClassChange(e, name)}
              resources={[{ name: '' }, ...util.getSubClasses(linkedClass.name, schema)]}
              label={`${name} Class`}
              value={model[name]['@class']}
              error={errorFields.includes(name)}
            >
              {resource => (
                <MenuItem key={resource.name} value={resource.name}>
                  {resource.name || 'None'}
                </MenuItem>
              )}
            </ResourceSelectComponent>
          );
        }
        return (
          <ListItem component={fieldComponent} key={name}>
            {classSelector}
            <FormTemplater
              onChange={e => onChange(e, name)}
              schema={schema}
              kbClass={(util.getClass(model[name]['@class'], schema)).properties}
              model={model[name]}
              excludedProps={['@class']}
              fieldComponent="div"
              errorFields={errorFields.map(errorField => errorField.replace(`${name}.`, ''))}
              pairs={pairs}
            />
          </ListItem>
        );
      }
      if (choices) {
        return (
          <ListItem component={fieldComponent} key={name}>
            <ResourceSelectComponent
              name={name}
              onChange={e => onChange(e)}
              resources={choices}
              label={util.antiCamelCase(name)}
              value={model[name]}
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
      } else if (type === 'integer' || type === 'long') {
        t = 'number';
        step = 1;
      }

      return (
        <ListItem component={fieldComponent} key={name}>
          <TextField
            style={{ width: '100%' }}
            label={util.antiCamelCase(name)}
            value={model[name]}
            onChange={onChange}
            name={name}
            type={t || ''}
            step={step || ''}
            required={mandatory}
            multiline={t === 'text'}
            error={errorFields.includes(name)}
            InputProps={{
              endAdornment: description && (
                <InputAdornment position="end">
                  <Tooltip title={description}>
                    <HelpIcon color="primary" />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </ListItem>
      );
    };
    const completedpairs = {};
    const sortedProps = Object.values(kbClass || {})
      .filter(p => !excludedProps.includes(p.name))
      .sort(sort);

    sortedProps.forEach((property) => {
      Object.keys(pairs).forEach((key) => {
        if (
          pairs[key].includes(property.name)
          && !Object.values(completedpairs).some(g => g.includes(property.name))
        ) {
          fields.push((
            <div className="form-templater-group-wrapper" key={key}>
              <div className="form-templater-row-grid">
                {pairs[key].map(k => formatFormField(sortedProps.find(p => p.name === k)))}
              </div>
            </div>
          ));
          completedpairs[key] = pairs[key].slice();
        }
      });
      if (!Object.values(completedpairs).some(g => g.includes(property.name))) {
        fields.push(formatFormField(property));
      }
    });
    return fields;
  }
}

/**
 * @param {Object} schema - Knowledgebase db schema.
 * @param {function} onChange - Model updating function
 * @param {Object} model - Model object.
 * @param {Array} kbClass - Form object schema.
 * @param {Array} excludedProps - List of propstrings to be excluded from
 * generation.
 * @param {string} fieldComponent - Component to pass to material UI ListItem
 * component
 * @param {Array} errorFields - list of field keys that are causing errors in
 * parent component.
 * @param {function} sort - Sorting function for form fields.
 * @param {Object} pairs - group definitions for grid.
 */
FormTemplater.propTypes = {
  schema: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClassChange: PropTypes.func,
  model: PropTypes.object.isRequired,
  kbClass: PropTypes.any,
  excludedProps: PropTypes.array,
  fieldComponent: PropTypes.string,
  errorFields: PropTypes.array,
  sort: PropTypes.func,
  pairs: PropTypes.object,
};

FormTemplater.defaultProps = {
  excludedProps: [],
  kbClass: {},
  onClassChange: null,
  fieldComponent: 'li',
  errorFields: [],
  sort: () => 1,
  pairs: {},
};

export default FormTemplater;
