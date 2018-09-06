import React, { Component } from 'react';
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
} from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import util from '../../services/util';

class FormTemplater extends Component {
  /**
   * Given a schema class object, find all other classes that inherit it.
   * @param {string} abstractClass - property class key.
   */
  getSubClasses(abstractClass) {
    const { schema } = this.props;
    return Object.values(schema)
      .filter(kbClass => kbClass.inherits.includes(abstractClass));
  }

  /**
   * Given a schema class object, determine whether it is abstract or not.
   * @param {string} linkedClass - property class key.
   */
  isAbstract(linkedClass) {
    const { schema } = this.props;
    return Object.values(schema)
      .some(kbClass => kbClass.inherits.includes(linkedClass));
  }

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
    } = this.props;
    const fields = [];
    Object.values(kbClass || {}).forEach((property) => {
      const {
        name,
        type,
        mandatory,
        linkedClass,
        description,
      } = property;
      if (!excludedProps.includes(name)) {
        // Radio group component for boolean types.
        if (type === 'boolean') {
          fields.push(
            <ListItem component="div" key={name}>
              <FormControl component="fieldset" required={mandatory}>
                <FormLabel>
                  {util.antiCamelCase(name)}
                </FormLabel>
                <RadioGroup
                  name={name}
                  onChange={(e) => onChange(e)}
                  value={model[name].toString()}
                  style={{ flexDirection: 'row' }}
                >
                  <FormControlLabel value="true" control={<Radio />} label="Yes" />
                  <FormControlLabel value="false" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </ListItem>,
          );
        } else if (type === 'link') {
          // If type is a link to another record, must find that record in the
          // database and store its rid.

          // Decide which endpoint to query.
          let endpoint;
          if (linkedClass) {
            endpoint = linkedClass.route.slice(1);
          }

          fields.push(
            <ListItem component="div" key={name} style={{ display: 'block' }}>
              <AutoSearchComponent
                value={model[name]}
                onChange={onChange}
                name={name}
                label={util.antiCamelCase(name)}
                limit={30}
                endpoint={endpoint}
                required={mandatory}
                property={!linkedClass ? ['name', 'sourceId'] : undefined}
              />
            </ListItem>,
          );
        } else if (type === 'embedded') {
          let classSelector = null;
          const handleClassChange  = onClassChange ? onClassChange : onChange;
          if (this.isAbstract(linkedClass.name)) {
            classSelector = (
              <ResourceSelectComponent
                name="@class"
                onChange={e => handleClassChange(e, name)}
                resources={[{ name: '' }, ...this.getSubClasses(linkedClass.name)]}
                label={`${name} Class`}
                value={model[name]['@class']}
              >
                {resource => (
                  <MenuItem key={resource.name} value={resource.name}>
                    {resource.name}
                  </MenuItem>
                )}
              </ResourceSelectComponent>
            );
          }
          fields.push(
            <ListItem component="div" key={name} style={{ display: 'block' }}>
              {classSelector}
              <FormTemplater
                onChange={e => onChange(e, name)}
                schema={schema}
                kbClass={(util.getClass(model[name]['@class'], schema)).properties}
                model={model[name]}
                excludedProps={['@class']}
              />
            </ListItem>,
          );
        } else {
          // For text fields, apply some final changes for number inputs.
          let t;
          let step;
          if (type === 'string') {
            t = 'text';
          } else if (type === 'integer' || type === 'long') {
            t = 'number';
            step = 1;
          }

          fields.push(
            <ListItem component="div" key={name}>
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
            </ListItem>,
          );
        }
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
 */
FormTemplater.propTypes = {
  schema: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClassChange: PropTypes.func,
  model: PropTypes.object.isRequired,
  kbClass: PropTypes.any,
  excludedProps: PropTypes.array,
};

FormTemplater.defaultProps = {
  excludedProps: [],
  kbClass: {},
  onClassChange: null,
};

export default FormTemplater;
