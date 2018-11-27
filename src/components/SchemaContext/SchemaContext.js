/**
 * @module /components/SchemaContext
 */
import React from 'react';

/**
 * Provides the `schema` prop throughout all children that are passed through
 * `withSchema`.
 */
const SchemaContext = React.createContext(null);
const withSchema = Child => props => (
  <SchemaContext.Consumer>
    {schema => <Child schema={schema} {...props} />}
  </SchemaContext.Consumer>
);
export {
  SchemaContext,
  withSchema,
};
