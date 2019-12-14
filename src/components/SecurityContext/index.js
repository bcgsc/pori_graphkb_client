import React from 'react';


/**
 * Passes user values to wrapped consumers.
 */
const KBContext = React.createContext({
  authorizationToken: '',
  authenticationToken: '',
  setAuthenticationToken: () => {},
  setAuthorizationToken: () => {},
});

const withKB = Child => props => (
  <KBContext.Consumer>
    {kbValues => (
      <Child
        {...kbValues}
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
