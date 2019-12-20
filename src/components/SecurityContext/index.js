import React from 'react';


/**
 * Passes user values to wrapped consumers.
 */
const SecurityContext = React.createContext({
  authorizationToken: '',
  authenticationToken: '',
  setAuthenticationToken: () => {},
  setAuthorizationToken: () => {},
});

const withKB = Child => props => (
  <SecurityContext.Consumer>
    {kbValues => (
      <Child
        {...kbValues}
        {...props}
      />
    )}
  </SecurityContext.Consumer>
);

export {
  SecurityContext,
  withKB,
};

export default SecurityContext;
