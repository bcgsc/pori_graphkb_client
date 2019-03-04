/**
 * Validates a value against some property model and returns the new property tracking object
 */
const validateValue = (propModel, value, ignoreMandatory = false) => {
  const fieldContent = {};

  if (value === undefined || value === '') {
    if (propModel.mandatory
      && !ignoreMandatory
      && !propModel.generated
      && propModel.default === undefined
      && !propModel.generateDefault
    ) {
      return { error: { message: 'Required Value' }, value };
    }
  } else if (value === null && !propModel.nullable) {
    return { error: { message: 'Cannot be empty/null' }, value };
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
  EDIT: 'edit', VIEW: 'view', DELETE: 'delete', NEW: 'new', SEARCH: 'search',
};


export {
  validateValue, CLASS_MODEL_PROP, FORM_VARIANT,
};
