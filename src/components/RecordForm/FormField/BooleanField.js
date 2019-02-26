import React from 'react';
import {
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@material-ui/core';
import PropTypes from 'prop-types';


import util from '../../../services/util';


const BooleanField = (props) => {
  const {
    error, model, onValueChange, disabled, ...rest
  } = props;
  const value = props.value === undefined || props.value === null
    ? null
    : props.value.toString();

  return (
    <div
      className="form-templater-radio-wrapper"
      {...rest}
    >
      <FormControl
        component="fieldset"
        required={model.mandatory}
        error={error}
        disabled={model.generated || disabled}
      >
        <FormLabel>
          {util.antiCamelCase(model.name)}
        </FormLabel>
        <RadioGroup
          name={model.name}
          onChange={e => onValueChange(e)}
          value={value}
          style={{ flexDirection: 'row' }}
        >
          <FormControlLabel value="true" control={<Radio checked={value === 'true'} />} label="Yes" />
          <FormControlLabel value="false" control={<Radio checked={value === 'false'} />} label="No" />
        </RadioGroup>
      </FormControl>
    </div>
  );
};

BooleanField.propTypes = {
  error: PropTypes.bool,
  model: PropTypes.object.isRequired,
  onValueChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  disabled: PropTypes.bool,
};

BooleanField.defaultProps = {
  error: false,
  value: undefined,
  disabled: false,
};

export default BooleanField;
