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
} from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import util from '../../services/util';

class FormTemplater extends Component {
  /**
   * Given a schema class object, find all other classes that inherit it.
   */
  getSubClasses(abstractClass) {
    const { schema } = this.props;
    return Object.values(schema)
      .filter(kbClass => kbClass.inherits.includes(abstractClass));
  }

  /**
   * Given a schema class object, determine whether it is abstract or not.
   * @param {Object} linkedClass - property object class
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
      handleChange,
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
            <ListItem className="input-wrapper" key={name}>
              <FormControl component="fieldset" required={mandatory}>
                <FormLabel>
                  {util.antiCamelCase(name)}
                </FormLabel>
                <RadioGroup
                  name={name}
                  onChange={handleChange}
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
            <ListItem key={name} style={{ display: 'block' }}>
              <div>
                <AutoSearchComponent
                  value={model[name]}
                  onChange={handleChange}
                  name={name}
                  label={util.antiCamelCase(name)}
                  limit={30}
                  endpoint={endpoint}
                  required={mandatory}
                  property={!linkedClass ? ['name', 'sourceId'] : undefined}
                />
              </div>
            </ListItem>,
          );// } else if (type === 'embedded') { } // ONCE isAbstract is ready.
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
            <ListItem className="input-wrapper" key={name}>
              <TextField
                label={util.antiCamelCase(name)}
                value={model[name]}
                onChange={handleChange}
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
            </ListItem>,
          );
        }
      }
    });
    return fields;
  }
}

FormTemplater.propTypes = {
  schema: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  model: PropTypes.object.isRequired,
  kbClass: PropTypes.any.isRequired,
  excludedProps: PropTypes.array,
};

FormTemplater.defaultProps = {
  excludedProps: [],
};

export default FormTemplater;
