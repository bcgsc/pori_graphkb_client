import React, { ReactNode } from 'react'; // eslint-disable-line no-unused-vars

interface FormStepWrapperProps {
  children: ReactNode;
  label: string;
  fields?: string[];
}

/**
 * Component to pass the step props to (label and fields) which is not actually displayed
 */
const FormStepWrapper = ({
  children,
}: FormStepWrapperProps) => children as JSX.Element;

FormStepWrapper.defaultProps = {
  fields: [],
};

export default FormStepWrapper;
