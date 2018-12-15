/**
 * @module /App
 */
import React from 'react';
import { Router } from 'react-router-dom';
import {
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core/styles';
import Main from './views/Main/Main';
import history from './services/history';
import { SnackbarProvider } from './components/Snackbar/Snackbar';

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


/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <SnackbarProvider>
        <Router history={history}>
          <Main />
        </Router>
      </SnackbarProvider>
    </MuiThemeProvider>
  );
}

export default App;
