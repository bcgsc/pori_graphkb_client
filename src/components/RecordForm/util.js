/**
 * Validates a value against some property model and returns the new property tracking object
 */
const validateValue = (propModel, value) => {
  const fieldContent = {};

  if (value === undefined || value === '') {
    if (propModel.mandatory && !propModel.generated) {
      return { error: { message: 'Required Value' }, value };
    }
  } else {
    fieldContent.value = value;

    if (fieldContent.value !== null) { // validate the new value using the schema model property
      try {
        let valueToValidate = fieldContent.value;
        if (propModel.type === 'link') {
          valueToValidate = fieldContent.value['@rid'] || fieldContent.value;
        }
        propModel.validate(valueToValidate);
      } catch (err) {
        fieldContent.error = err;
      }
    }
  }
  return fieldContent;
};


const CLASS_MODEL_PROP = '@class';

const FORM_VARIANT = {
  EDIT: 'edit', VIEW: 'view', DELETE: 'delete', NEW: 'new',
};


export {
  validateValue, CLASS_MODEL_PROP, FORM_VARIANT,
};
