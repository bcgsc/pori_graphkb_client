import './index.scss';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import {
  Step,
  StepButton,
  StepContent,
  StepLabel,
  Stepper,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, {
  useCallback, useContext, useEffect,
  useRef, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import FormContext from '@/components/FormContext';
import useObject from '@/components/hooks/useObject';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import { FORM_VARIANT } from '@/components/util';


/**
 * @param {object} props
 * @param {Array.<FormStepWrapper>} children the children of a SteppedForm should be FormStepWrapper elements
 * @param {string} modelName the db class model the form is based on
 * @param {Object.<string,Property>} properties property definitions for the form fields
 * @param {function} onSubmit handler to call on form submission
 */
const SteppedForm = ({
  children, modelName, properties, onSubmit, className,
}) => {
  const snackbar = useContext(SnackbarContext);
  const [activeStep, setActiveStep] = useState(0);
  const controllers = useRef([]);
  const { content: visited, updateField: setStepVisit } = useObject({ 0: true });
  const form = useSchemaForm(properties, { '@class': modelName }, { variant: FORM_VARIANT.NEW });
  const {
    formContent, formErrors, formHasErrors,
  } = form;

  useEffect(() => () => controllers.current.forEach(c => c.abort()), []);

  const handleOnClick = useCallback((index) => {
    setStepVisit(index, true);
    setActiveStep(index);
  }, [setStepVisit]);

  const isIncomplete = React.Children.toArray(children).some((s, index) => !visited[index]);

  /**
   * Handler for submission of a new record
   */
  const handleSubmit = useCallback(async () => {
    if (isIncomplete || formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
    } else {
      // ok to submit
      onSubmit(formContent);
    }
  }, [formContent, formErrors, formHasErrors, isIncomplete, onSubmit, snackbar]);

  return (
    <FormContext.Provider value={form}>
      <Stepper
        activeStep={activeStep}
        className={`stepped-form ${className}`}
        elevation={0}
        nonLinear
        orientation="vertical"
      >
        {React.Children.toArray(children).filter(child => child).map((child, index) => {
          if (!child) {
            return child;
          }
          const { fields, label } = child.props;
          const errors = fields.some(f => formErrors[f]);
          return (
            <Step>
              <StepButton
                completed={visited[index] && !errors}
                data-testid={`stepped-form__step-button-${index}`}
                onClick={() => handleOnClick(index)}
              >
                <StepLabel
                  className="stepped-form__step-label"
                  error={errors && visited[index]}
                >
                  {label}
                </StepLabel>
              </StepButton>
              <StepContent>
                {child}
              </StepContent>
            </Step>
          );
        })}
        <ActionButton
          className="stepped-form__action"
          disabled={formHasErrors || isIncomplete}
          onClick={handleSubmit}
          requireConfirm={false}
        >
          SUBMIT
        </ActionButton>
      </Stepper>
    </FormContext.Provider>
  );
};


SteppedForm.propTypes = {
  children: PropTypes.node.isRequired,
  modelName: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  properties: PropTypes.object.isRequired,
  className: PropTypes.string,
};

SteppedForm.defaultProps = {
  className: '',
};

export default SteppedForm;
