import React from 'react';

/**
 * Passes user and schema values to wrapped consumers.
 */
const KBContext = React.createContext({ schema: null, user: null });

const withKB = Child => props => (
  <KBContext.Consumer>
    {kbValues => <Child schema={kbValues.schema} user={kbValues.user} {...props} />}
  </KBContext.Consumer>
);
export {
  KBContext,
  withKB,
};
