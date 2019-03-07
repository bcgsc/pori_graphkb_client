/**
 * @module /App
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  createMuiTheme,
  MuiThemeProvider,
  createGenerateClassName, jssPreset,
} from '@material-ui/core/styles';
import JssProvider from 'react-jss/lib/JssProvider';
import { create } from 'jss';


import SnackbarProvider from '@bcgsc/react-snackbar-provider';

import Main from './views/Main/Main';

const theme = createMuiTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#26328C',
    },
    secondary: {
      main: '#54B198',
      light: '#CCCFE2',
    },
    error: {
      main: '#d32f2f',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.7)',
      secondary: 'rgba(0, 0, 0, 0.54)',
    },
  },
  typography: {
    useNextVariants: true,
  },
});


const generateClassName = createGenerateClassName();
const jss = create({
  ...jssPreset(),
  // We define a custom insertion point that JSS will look for injecting the styles in the DOM.
  insertionPoint: 'jss-insertion-point',
});


/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
function App() {
  return (
    <JssProvider jss={jss} generateClassName={generateClassName}>
      <MuiThemeProvider theme={theme}>
        <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <BrowserRouter>
            <Main />
          </BrowserRouter>
        </SnackbarProvider>
      </MuiThemeProvider>
    </JssProvider>
  );
}

export default App;
