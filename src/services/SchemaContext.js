import React from 'react';

const SchemaContext = React.createContext(null);
const withSchema = Child => props => (
  <SchemaContext.Consumer>
    {schema => <Child schema={schema} {...props} />}
  </SchemaContext.Consumer>
);
export {
  /* eslint-disable */
  SchemaContext,
  withSchema,
};
