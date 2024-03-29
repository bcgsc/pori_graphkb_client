import './index.scss';

import {
  Step,
  StepButton,
  StepContent,
  StepLabel,
  Stepper,
} from '@material-ui/core';
import { useSnackbar } from 'notistack';
import React, { ReactNode, useCallback, useState } from 'react';

import ActionButton from '@/components/ActionButton';
import FormContext from '@/components/FormContext';
import useObject from '@/components/hooks/useObject';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import { FORM_VARIANT } from '@/components/util';

interface SteppedFormProps {
  /** the children of a SteppedForm should be FormStepWrapper elements */
  children: ReactNode;
  /** the db class model the form is based on */
  modelName: string;
  onDelete: (formContent: unknown) => void;
  /** handler to call on form submission */
  onSubmit: (formContent: unknown) => void;
  /** property definitions for the form fields */
  properties: Record<string, unknown>;
  className?: string;
  formVariant?: FORM_VARIANT;
  value?: Record<string, unknown>;
}

const SteppedForm = ({
  children, modelName, properties, onSubmit, className, value, formVariant, onDelete,
}: SteppedFormProps) => {
  const snackbar = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const { content: visited, updateField: setStepVisit } = useObject({ 0: true });
  const form = useSchemaForm(properties, { '@class': modelName, ...value }, { variant: formVariant });
  const {
    formContent, formErrors, formHasErrors, formIsDirty,
  } = form;

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
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted', { variant: 'error' });
    } else {
      // ok to submit
      onSubmit(formContent);
    }
  }, [formContent, formErrors, formHasErrors, isIncomplete, onSubmit, snackbar]);

  const handleDelete = useCallback(() => {
    onDelete(formContent);
  }, [formContent, onDelete]);

  return (
    <FormContext.Provider value={form}>
      <Stepper
        activeStep={activeStep}
        className={`stepped-form ${className}`}
        elevation={0}
        nonLinear
        orientation="vertical"
      >
        {React.Children.toArray(children).filter((child) => child).map((child, index) => {
          if (!child) {
            return child;
          }
          const { fields, label } = child.props;
          const errors = fields.some((f) => formErrors[f]);
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
        <div className="stepped-form__actions">
          {formVariant === FORM_VARIANT.EDIT && (
          <ActionButton
            className="stepped-form__actions--secondary"
            onClick={handleDelete}
            requireConfirm
            variant="outlined"
          >
            DELETE
          </ActionButton>
          )}
          <ActionButton
            className="stepped-form__actions--primary"
            disabled={formHasErrors || isIncomplete || (formVariant === FORM_VARIANT.EDIT && !formIsDirty)}
            onClick={handleSubmit}
            requireConfirm={false}
          >
            {formVariant === FORM_VARIANT.NEW ? 'SUBMIT' : 'SUBMIT CHANGES'}
          </ActionButton>
        </div>
      </Stepper>
    </FormContext.Provider>
  );
};

SteppedForm.defaultProps = {
  className: '',
  value: {},
  formVariant: FORM_VARIANT.NEW,
};

export default SteppedForm;
