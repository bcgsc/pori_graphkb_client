import React from 'react';
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
} from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import AutoSearchComponent from '../components/AutoSearchComponent/AutoSearchComponent';
import util from './util';

export default class Templater {
  constructor(schema, handleChange) {
    this.schema = schema;
    this.handleChange = handleChange;
  }

  /**
   * Given a schema class object, determine whether it is abstract or not.
   * @param {Object} linkedClass - property object class
   */
  isAbstract(linkedClass) {
    return Object.values(this.schema)
      .some(kbClass => kbClass.inherits.includes(linkedClass));
  }

  /**
   * Given a schema class object, find all other classes that inherit it.
   */
  getSubClasses(abstractClass) {
    return Object.values(this.schema)
      .filter(kbClass => kbClass.inherits.includes(abstractClass));
  }

  static initModel(model, kbClass) {
    const newModel = Object.assign({}, model);
    Object.values(kbClass).forEach((property) => {
      const {
        name,
        type,
        linkedClass,
      } = property;
      const defaultValue = property.default;
      switch (type) {
        case 'embeddedset':
          newModel[name] = model[name] || [];
          break;
        case 'link':
          newModel[name] = (model[name] || '').name || '';
          newModel[`${name}.@rid`] = (model[name] || '')['@rid'] || '';
          newModel[`${name}.sourceId`] = (model[name] || '').sourceId || '';
          if (!linkedClass) {
            newModel[`${name}.class`] = (model[name] || '')['@class'] || '';
          }
          break;
        case 'integer' || 'long':
          newModel[name] = model[name] || '';
          break;
        case 'boolean':
          newModel[name] = model[name] !== undefined
            ? model[name]
            : (defaultValue || '').toString() === 'true';
          break;
        case 'embedded':
          if (linkedClass && linkedClass.properties) {
            newModel[name] = model[name] || this.initModel({}, property.linkedClass.properties);
          }
          break;
        default:
          newModel[name] = model[name] || '';
          break;
      }
    });
    return newModel;
  }

  /**
   * Creates DOM models to be rendered.
   * @param {Object} model - Object to which data will be bound.
   * @param {Object} kbClass - Filtered schema object containing ONLY and ALL classes to be
   * rendered. (Schema.properties)
   */
  generateFields(model, kbClass) {
    const fields = {};
    Object.values(kbClass).forEach((property) => {
      const {
        name,
        type,
        mandatory,
        linkedClass,
        description,
      } = property;
      // Radio group component for boolean types.
      if (type === 'boolean') {
        fields[name] = (
          <ListItem className="input-wrapper" key={name}>
            <FormControl component="fieldset" required={mandatory}>
              <FormLabel>
                {util.antiCamelCase(name)}
              </FormLabel>
              <RadioGroup
                name={name}
                onChange={this.handleChange}
                value={model[name].toString()}
                style={{ flexDirection: 'row' }}
              >
                <FormControlLabel value="true" control={<Radio />} label="Yes" />
                <FormControlLabel value="false" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </ListItem>
        );
      } else if (type === 'link') {
        // If type is a link to another record, must find that record in the
        // database and store its rid.

        // Decide which endpoint to query.
        let endpoint;
        if (linkedClass) {
          endpoint = linkedClass.route.slice(1);
        }

        fields[name] = (
          <ListItem key={name} style={{ display: 'block' }}>
            <div>
              <AutoSearchComponent
                value={model[name]}
                onChange={this.handleChange}
                name={name}
                label={util.antiCamelCase(name)}
                limit={30}
                endpoint={endpoint}
                required={mandatory}
                property={!linkedClass ? ['name', 'sourceId'] : undefined}
              />
            </div>
          </ListItem>
        );
      }
      // } else if (type === 'embedded') { } // ONCE isAbstract is ready.
      else {
        // For text fields, apply some final changes for number inputs.
        let t;
        let step;
        if (type === 'string') {
          t = 'text';
        } else if (type === 'integer' || type === 'long') {
          t = 'number';
          step = 1;
        }

        fields[name] = (
          <ListItem className="input-wrapper" key={name}>
            <TextField
              label={util.antiCamelCase(name)}
              value={model[name]}
              onChange={this.handleChange}
              className="text-input"
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
          </ListItem>
        );
      }
    });
    return fields;
  }
}
