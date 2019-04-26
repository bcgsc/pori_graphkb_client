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
      main: 'var(--palette__primary--main)',
      light: 'var(--palette__primary--light)',
      dark: 'var(--palette__primary--dark)',
      contrastText: 'var(--palette__primary--contrast-text)',
    },
    secondary: {
      main: 'var(--palette__secondary--main)',
      light: 'var(--palette__secondary--light)',
      dark: 'var(--palette__secondary--dark)',
      contrastText: 'var(--palette__secondary--contrast-text)',
    },
    error: {
      main: 'var(--palette__error--main)',
      light: 'var(--palette__error--light)',
      dark: 'var(--palette__error--dark)',
      contrastText: 'var(--palette__error--contrast-text)',
    },
    text: {
      primary: 'var(--palette__text--primary)',
      secondary: 'var(--palette__text--secondary)',
      disabled: 'var(--palette__text--disabled)',
      hint: 'var(--palette__text--hint)',
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
