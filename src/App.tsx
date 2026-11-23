import { SnackbarProvider } from 'notistack';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import { createBrowserRouter, RouterContextProvider, RouterProvider } from 'react-router';

import api from '@/services/api';

import ThemeProvider from './theme';
import MainView, { createRoutes } from './views/MainView';

const router = createBrowserRouter(createRoutes(MainView), {
  basename: window._env_.PUBLIC_PATH,
  getContext: async () => {
    const context = new RouterContextProvider();
    context.set(api.routerQueryContext, api.queryClient);
    return context;
  },
});

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={api.queryClient}>
        <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
