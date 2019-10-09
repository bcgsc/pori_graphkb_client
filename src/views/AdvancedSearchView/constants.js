const OPERATORS_OPTS = ['=', 'CONTAINS', 'CONTAINSALL', 'CONTAINSTEXT', 'CONTAINSANY', 'IN', '>=', '>', '<=', '<', 'IS'];

const generateOperatorOptions = () => {
  const OPERATORS = [];
  OPERATORS_OPTS.forEach((op) => {
    const operatorOpt = {};
    ['label', 'value', 'key'].forEach((val) => { operatorOpt[val] = op; });
    OPERATORS.push(operatorOpt);
  });

  const findOptIndex = (operatorName) => {
    const index = OPERATORS.findIndex(opt => opt.label === operatorName);
    return index;
  };

  const iterableCaption = 'To be used on iterables such as appliedTo, impliedBy etc.';

  OPERATORS[findOptIndex('CONTAINSALL')].caption = iterableCaption;
  OPERATORS[findOptIndex('CONTAINSANY')].caption = iterableCaption;
  OPERATORS[findOptIndex('CONTAINS')].caption = iterableCaption;
  OPERATORS[findOptIndex('CONTAINSTEXT')].caption = 'contains your inputted substring';

  return OPERATORS;
};

const OPERATORS = generateOperatorOptions();

export {
  OPERATORS,
};
