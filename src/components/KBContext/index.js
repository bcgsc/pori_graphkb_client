import React from 'react';


/**
 * Passes user and schema values to wrapped consumers.
 */
const KBContext = React.createContext({ schema: null, auth: null });

const withKB = Child => props => (
  <KBContext.Consumer>
    {kbValues => <Child schema={kbValues.schema} auth={kbValues.auth} {...props} />}
  </KBContext.Consumer>
);

export {
  KBContext,
  withKB,
};

export default KBContext;
