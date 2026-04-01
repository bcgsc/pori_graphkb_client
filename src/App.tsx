import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/components/Auth';
import api from '@/services/api';

import MainView from './views/MainView';

const cache = createCache({
  key: 'css',
  prepend: true,
});

const theme = createTheme({
  direction: 'ltr',
  components: {
    MuiButton: { defaultProps: { size: 'small' } },
    MuiChip: { defaultProps: { size: 'small' } },
    MuiFab: { defaultProps: { size: 'small' } },
    MuiFilledInput: { defaultProps: { margin: 'dense' } },
    MuiFormControl: { defaultProps: { margin: 'none' } },
    MuiFormHelperText: { defaultProps: { margin: 'dense' } },
    MuiIconButton: { defaultProps: { size: 'small' } },
    MuiInputLabel: { defaultProps: { margin: 'dense' } },
    MuiListItem: { defaultProps: { dense: true } },
    MuiOutlinedInput: { defaultProps: { margin: 'dense' } },
    MuiSvgIcon: { defaultProps: { fontSize: 'small' } },
    MuiTable: { defaultProps: { size: 'small' } },
    MuiTextField: { defaultProps: { variant: 'standard' } },
    MuiToggleButton: { defaultProps: { size: 'small' } },
    MuiToggleButtonGroup: { defaultProps: { size: 'small' } },
    MuiToolbar: { defaultProps: { variant: 'dense' } },
  },
  mixins: {},
  palette: {
    mode: 'light',
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

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
function App() {
  return (
    <CacheProvider value={cache}>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={api.queryClient}>
          <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <BrowserRouter basename={window._env_.PUBLIC_PATH}>
              <AuthProvider>
                <MainView />
              </AuthProvider>
            </BrowserRouter>
          </SnackbarProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
