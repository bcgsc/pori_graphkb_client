/*eslint-disable*/
const {error: {ErrorMixin}} = require('@bcgsc/knowledgebase-parser');


class AttributeError extends ErrorMixin {}


module.exports = {AttributeError};
