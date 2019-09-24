import React from 'react';

import Schema from '../../services/schema';

/**
 * Passes user and schema values to wrapped consumers.
 */
const KBContext = React.createContext({
  schema: new Schema(),
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
