import './index.scss';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import React, { ReactNode } from 'react';

ModuleRegistry.registerModules([AllCommunityModule]);

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
    MuiFormLabel: { styleOverrides: { asterisk: ({ theme }) => ({ color: theme.palette.error.main }) } },
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

export default function GkbThemeProvider({ children }: { children: ReactNode }) {
  return (
    <CacheProvider value={cache}>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
