const OPERATORS_OPTS = ['=', 'CONTAINS', 'CONTAINSALL', 'CONTAINSTEXT', 'CONTAINSANY', 'IN', '>=', '>', '<=', '<', 'IS'];

const generateOperatorOptions = () => {
  const iterableCaption = 'To be used on iterables such as appliedTo, impliedBy etc.';
  const OPERATORS = [];
  OPERATORS_OPTS.forEach((op) => {
    const operatorOpt = {};
    ['label', 'value', 'key'].forEach((val) => { operatorOpt[val] = op; });

    if (['CONTAINS', 'CONTAINSALL', 'CONTAINSANY', 'IN'].includes(op)) {
      operatorOpt.caption = iterableCaption;
      operatorOpt.iterable = true;
    }
    OPERATORS.push(operatorOpt);
  });

  const findOptIndex = (operatorName) => {
    const index = OPERATORS.findIndex(opt => opt.label === operatorName);
    return index;
  };

  OPERATORS[findOptIndex('CONTAINSTEXT')].caption = 'contains your inputted substring';
  return OPERATORS;
};
/**
 * format: Array of Operator Option Objects.
 * Operator Option (opt) object consists of 4 properties
 * @property {string} opt.label how the operator option is displayed
 * @property {string} opt.value the value of the selection. usually the same as label.
 * @property {string} opt.key React prop to optimize rendering. usually same as label.
 * @property {string} opt.caption optional description of operator option
 */
const OPERATORS = generateOperatorOptions();

export {
  OPERATORS,
};
