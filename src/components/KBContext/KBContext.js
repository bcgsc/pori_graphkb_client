import React from 'react';

const KBContext = React.createContext(null);
const withKB = Child => props => (
  <KBContext.Consumer>
    {kbValues => <Child schema={kbValues.schema} user={kbValues.user} {...props} />}
  </KBContext.Consumer>
);
export {
  KBContext,
  withKB,
};
