import React from 'react';


/**
 * Passes user and schema values to wrapped consumers.
 */
const KBContext = React.createContext({ schema: null, auth: null });

const withKB = Child => props => (
  <KBContext.Consumer>
    {kbValues => (
      <Child
        schema={kbValues.schema}
        authorizationToken={kbValues.authorizationToken}
        setAuthorizationToken={kbValues.setAuthorizationToken}
        authenticationToken={kbValues.authenticationToken}
        setAuthenticationToken={kbValues.setAuthenticationToken}
        {...props}
      />
    )}
  </KBContext.Consumer>
);

export {
  KBContext,
  withKB,
};

export default KBContext;
