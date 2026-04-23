import { SnackbarProvider } from 'notistack';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router';

import { AuthProvider } from '@/components/Auth';
import api from '@/services/api';

import ThemeProvider from './theme';
import MainView from './views/MainView';

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
function App() {
  return (
    <ThemeProvider>
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
  );
}

export default App;
