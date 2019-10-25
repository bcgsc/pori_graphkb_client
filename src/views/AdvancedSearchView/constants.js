const OPERATORS_OPTS = ['=', 'CONTAINS', 'CONTAINSALL', 'CONTAINSTEXT', 'CONTAINSANY', 'IN', '>=', '>', '<=', '<'];

const generateOperatorOptions = () => {
  const OPERATORS = [];
  OPERATORS_OPTS.forEach((op) => {
    const operatorOpt = {};
    ['label', 'value', 'key'].forEach((val) => { operatorOpt[val] = op; });

    if (['CONTAINS', 'CONTAINSALL', 'CONTAINSANY'].includes(op)) {
      operatorOpt.iterable = true;
    }

    if (['>=', '>', '<=', '<'].includes(op)) {
      operatorOpt.isNumOperator = true;
    }
    OPERATORS.push(operatorOpt);
  });

  const findOptIndex = (operatorName) => {
    const index = OPERATORS.findIndex(opt => opt.label === operatorName);
    return index;
  };

  OPERATORS[findOptIndex('=')].caption = 'Equals to (Ex. relevance = sensitivity)';
  OPERATORS[findOptIndex('CONTAINS')].caption = 'true if at least one value of the queried record\'s property that satisfies the property value condition';
  OPERATORS[findOptIndex('CONTAINSALL')].caption = 'true if all of the values in the queried record\'s property satisfies the property value condition';
  OPERATORS[findOptIndex('CONTAINSANY')].caption = 'returns true if there is any match between the property value condition and the record\'s property values';
  OPERATORS[findOptIndex('CONTAINSTEXT')].caption = 'contains your inputted substring';
  OPERATORS[findOptIndex('IN')].caption = 'If the queried record\'s property is in any of the property value conditions selected';
  return OPERATORS;
};
/**
 * format: Array of Operator Option Objects.
 * Operator Option (opt) object consists of 4 properties
 * @property {string} opt.label how the operator option is displayed
 * @property {string} opt.value the value of the selection. usually the same as label.
 * @property {string} opt.key React prop to optimize rendering. usually same as label.
 * @property {string} opt.iterable if the operator works on an iterable property
 * @property {string} opt.caption optional description of operator option
 */
const OPERATORS = generateOperatorOptions();

const BLACKLISTED_PROPERTIES = ['deletedAt', 'deletedBy', 'createdBy',
  'createdAt', 'history', 'uuid', 'groupRestrictions', 'comment', 'description',
  '@class', 'reviews', 'displayNameTemplate'];

export {
  OPERATORS,
  BLACKLISTED_PROPERTIES,
};
