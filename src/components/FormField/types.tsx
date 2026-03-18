export interface BaseFormFieldProps<V = unknown> {
  /** the name of the field used in propogating events */
  name: string;
  /** flag to indicate the user cannot change this field */
  disabled?: boolean | undefined;
  /** flag to indicate there has been an error filling this field */
  error?: boolean | undefined;
  /** flag to indicate this field must be filled */
  required?: boolean | undefined;
  /** the field label */
  label?: string | undefined;
  helperText?: string | undefined;
  errorText?: string | undefined;
  /** the current value */
  value: V | undefined;
  onChange?: (e: { target: { name: string; value: V } }) => void;
}
