import React from 'react';

const SnackbarContext = React.createContext({ add: () => {} });

const withSnackbar = Child => props => (
  <SnackbarContext.Consumer>
    {values => <Child snackbar={values} {...props} />}
  </SnackbarContext.Consumer>
);

export {
  withSnackbar,
  SnackbarContext,
};

export default SnackbarContext.Provider;
