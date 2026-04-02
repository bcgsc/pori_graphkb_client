import React from 'react';
import ThemeProvider from '../src/theme';
import { initialize, mswLoader, getWorker } from 'msw-storybook-addon'
import { QueryClient, QueryClientProvider } from 'react-query';
import '../src/static/graphkb-env-config';
import { HttpResponse, http } from 'msw';
import { QueryBody } from '../src/components/types';
import { definePreview } from '@storybook/react-vite';
import addonTest from '@storybook/addon-vitest';
import { MswParameters } from 'msw-storybook-addon'
import { PreviewAddon } from 'storybook/internal/csf';

export function mockQueryHandler(resolver: (body: QueryBody) => HttpResponse<any>) {
  return http.post(`${window._env_.API_BASE_URL}/api/query`, async ({ request }) => {
    const body = await request.clone().json();
    return resolver(body as any);
  })
}

// see https://github.com/mswjs/msw-storybook-addon/issues/180
try {
  getWorker();
} catch (_) {
  initialize({
    onUnhandledRequest: ({ url }, print) => {
      if (url.startsWith(window._env_.API_BASE_URL)) {
        print.error();
      }
    },
    // @ts-expect-error
    quiet: import.meta.env.CI === 'true',
  })
}

type MswTypes = {
  parameters: MswParameters
}

const addonMsw = () => ({}) as PreviewAddon<MswTypes>;

export default definePreview({
  addons: [addonTest(), addonMsw()],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => <ThemeProvider><Story /></ThemeProvider>,
    (Story, context) => {
      return <QueryClientProvider client={context.loaded.queryClient}><Story /></QueryClientProvider>
    }
  ],
  loaders: [mswLoader, () => ({ queryClient: new QueryClient({ defaultOptions: { queries: { retry: false }}})})],
});
