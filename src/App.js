/**
 * @module /App
 */
import { SnackbarContextProvider as SnackbarProvider } from '@bcgsc/react-snackbar-provider';
import { CssBaseline } from '@material-ui/core';
import {
  createGenerateClassName, createMuiTheme,
  jssPreset,
  MuiThemeProvider,
  StylesProvider,
} from '@material-ui/core/styles';
import { create } from 'jss';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import * as cssTheme from './_theme.scss';
import MainView from './views/MainView';

const theme = createMuiTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: cssTheme.primaryMain,
      light: cssTheme.primaryLight,
      dark: cssTheme.primaryDark,
      contrastText: cssTheme.primaryContrastText,
    },
    secondary: {
      main: cssTheme.secondaryMain,
      light: cssTheme.secondaryLight,
      dark: cssTheme.secondaryDark,
      contrastText: cssTheme.secondaryContrastText,
    },
    error: {
      main: cssTheme.errorMain,
      light: cssTheme.errorLight,
      dark: cssTheme.errorDark,
      contrastText: cssTheme.errorContrastText,
    },
    text: {
      primary: cssTheme.textPrimary,
      secondary: cssTheme.textSecondary,
      hint: cssTheme.textHint,
      disabled: cssTheme.textDisabled,
    },
  },
  typography: {
    body1: { fontSize: cssTheme.fontSizeBody1 },
    body2: { fontSize: cssTheme.fontSizeBody2 },
    h1: { fontSize: cssTheme.fontSizeH1 },
    h2: { fontSize: cssTheme.fontSizeH2 },
    h3: { fontSize: cssTheme.fontSizeH3 },
    h4: { fontSize: cssTheme.fontSizeH4 },
    h5: { fontSize: cssTheme.fontSizeH5 },
    h6: { fontSize: cssTheme.fontSizeH6 },
    subtitle1: { fontSize: cssTheme.fontSizeSubtitle1 },
  },
});


const generateClassName = createGenerateClassName();
const jss = create({
  ...jssPreset(),
  // We define a custom insertion point that JSS will look for injecting the styles in the DOM.
  insertionPoint: 'jss-insertion-point',
  injectFirst: true,
  generateClassName,
});


/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
function App() {
  return (
    <StylesProvider jss={jss}>
      <CssBaseline />
      <MuiThemeProvider theme={theme}>
        <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <BrowserRouter>
            <MainView />
          </BrowserRouter>
        </SnackbarProvider>
      </MuiThemeProvider>
    </StylesProvider>
  );
}

export default App;
