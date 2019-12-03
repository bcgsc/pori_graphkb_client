import './index.scss';

import {
  FormControl, FormHelperText,
  FormLabel, IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';
import React, {
  useEffect, useState,
} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';

import schema from '@/services/schema';

import FormLayout from '../FormLayout';
import {
  FORM_VARIANT,
} from '../util';
import FormField from '.';


/**
   * Form/View that displays the contents of a single node
   *
   * @property {string} props.variant the type of NodeForm to create
   * @property {string} props.rid the record id of the current record for the form
   * @property {string} props.title the title for this form
   * @property {string} props.modelName name of class model to be displayed
   * @property {value} props.value values of individual properties of passed class model
   */
const EmbeddedRecord = ({
  value: initialValue,
  errors,
  modelName: modelNameParam,
  variant,
  disabled,
  required,
  onChange,
  name: formName,
  helperText,
  FormLayoutComponent = FormLayout,
  ...rest
}) => {
  const [modelName, setModelName] = useState((initialValue && initialValue['@class']) || '');
  const [modelOptions, setModelOptions] = useState([]);
  const [formContent, setFormContent] = useState(initialValue || {});
  const [formErrors, setFormErrors] = useState(errors || {});

  const formHasErrors = Object.values(formErrors).some(err => err);

  // if the parent form passes down new values, replace the current ones
  useDeepCompareEffect(() => {
    setFormContent(initialValue || {});
    setFormErrors(errors || {});
  }, [initialValue || {}, errors || {}]);

  useEffect(() => {
    setModelName(formContent['@class']);
  }, [formContent]);

  // change the model options when the input modelName changes
  useEffect(() => {
    const options = schema.get(modelNameParam).descendantTree(true).map(m => ({
      label: m.name, value: m.name, key: m.name, caption: m.description,
    }));
    setModelOptions(options);

    if (options.length === 1) {
      setModelName(options[0].name);
    }
  }, [modelNameParam]);

  const handleOnChange = (event) => {
    // add the new value to the field
    const eventName = event.target.name || event.target.getAttribute('name'); // name of the form field triggering the event
    const eventValue = event.target.value;

    onChange({
      target: {
        name: formName,
        value: { ...formContent, [eventName]: eventValue },
      },
    });
  };

  if ((!formContent || !formContent['@class']) && variant === FORM_VARIANT.VIEW) {
    return null;
  }

  return (
    <FormControl className="embedded-record" disabled={disabled} error={formHasErrors} required={required}>
      <div className="embedded-record__header">
        <FormLabel>
          {formName}
        </FormLabel>
        { !disabled && (
          <IconButton
            onClick={() => onChange({ target: { name: formName, value: null } })}
          >
            <CancelIcon />
          </IconButton>
        )}
      </div>
      <div className="embedded-record__content">
        <FormField
          className="record-form__class-select"
          disabled={modelOptions.length < 2 || disabled}
          error={formErrors['@class'] || ''}
          model={{
            choices: modelOptions, required: true, name: '@class', type: 'string',
          }}
          onChange={handleOnChange}
          value={modelName}
        />
        {formContent && formContent['@class'] && (
          <FormLayoutComponent
            {...rest}
            content={formContent}
            disabled={disabled}
            errors={formErrors}
            modelName={formContent['@class']}
            onChange={handleOnChange}
            variant={variant}
          />
        )}
      </div>
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

EmbeddedRecord.propTypes = {
  name: PropTypes.string.isRequired,
  FormLayoutComponent: PropTypes.oneOf([PropTypes.object, PropTypes.func]),
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  helperText: PropTypes.string,
  modelName: PropTypes.string,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  onTopClick: PropTypes.func,
  required: PropTypes.bool,
  value: PropTypes.object,
  variant: PropTypes.string,
};

EmbeddedRecord.defaultProps = {
  disabled: false,
  required: false,
  modelName: '',
  onDelete: () => {},
  onChange: () => {},
  helperText: '',
  onTopClick: null,
  variant: FORM_VARIANT.VIEW,
  value: {},
  errors: {},
  FormLayoutComponent: FormLayout,
};

export default EmbeddedRecord;
