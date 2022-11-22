import { CssBaseline } from '@material-ui/core';
import {
  createGenerateClassName, createMuiTheme,
  jssPreset,
  MuiThemeProvider,
  StylesProvider,
} from '@material-ui/core/styles';
import { create } from 'jss';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/components/Auth';
import api from '@/services/api';

import MainView from './views/MainView';

const theme = createMuiTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#1b2786',
      light: '#4682b4',
      dark: '#111955',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#54b198',
      light: '#a0ebd8',
      dark: '#1f6552',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
      contrastText: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.7)',
      secondary: 'rgba(0, 0, 0, 0.54)',
      hint: 'rgba(0, 0, 0, 0.38)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  typography: {
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    h1: { fontSize: '1.7rem' },
    h2: { fontSize: '1.5rem' },
    h3: { fontSize: '1.4rem' },
    h4: { fontSize: '1.25rem' },
    h5: { fontSize: '1.1rem' },
    h6: { fontSize: '0.875rem' },
    subtitle1: { fontSize: '0.875rem' },
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
        <QueryClientProvider client={api.queryClient}>
          <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <BrowserRouter basename={window._env_.PUBLIC_PATH}>
              <AuthProvider>
                <MainView />
              </AuthProvider>
            </BrowserRouter>
          </SnackbarProvider>
        </QueryClientProvider>
      </MuiThemeProvider>
    </StylesProvider>
  );
}

export default App;
