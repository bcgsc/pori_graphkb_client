import React from 'react';
import ThemeProvider from '../src/theme';
import { initialize, mswLoader, getWorker } from 'msw-storybook-addon'
import { QueryClient, QueryClientProvider } from 'react-query';
import '../src/static/graphkb-env-config';
import { HttpRequestHandler, HttpResponse, http as httpBase, isCommonAssetRequest } from 'msw';
import { GeneralRecordType, QueryBody } from '../src/components/types';
import { definePreview } from '@storybook/react-vite';
import addonTest from '@storybook/addon-vitest';
import { MswParameters } from 'msw-storybook-addon'
import { PreviewAddon } from 'storybook/internal/csf';

export const http = {
  ...httpBase,
  gkb: {
    get: (...args: Parameters<HttpRequestHandler>) => httpBase.get(`${window._env_.API_BASE_URL}${args[0]}`, args[1]),
    query: (resolver: (body: QueryBody) => (HttpResponse<Partial<GeneralRecordType>[]> | Partial<GeneralRecordType>[])) => {
      return httpBase.post(`${window._env_.API_BASE_URL}/api/query`, async ({ request }) => {
        const body = await request.clone().json();
        const response = resolver(body as any);
        if (Array.isArray(response)) return HttpResponse.json(response);
        return response;
      })
    }
  }
}

// see https://github.com/mswjs/msw-storybook-addon/issues/180
try {
  getWorker();
} catch (_) {
  initialize({
    onUnhandledRequest: (request, print) => {
      if (request.url.startsWith(window._env_.API_BASE_URL) && !isCommonAssetRequest(request)) {
        print.error();
      }
    },
    // @ts-expect-error
    quiet: import.meta.env.CI === 'true',
  })
}

const snapshotAddon = () => ({}) as PreviewAddon<{ parameters: { snapshot?: boolean } }>;

const addonMsw = () => ({}) as PreviewAddon<{
  parameters: MswParameters
}>;

const preview = definePreview({
  addons: [addonTest(), addonMsw(), snapshotAddon()],
  parameters: {
    snapshot: true,
  },
  decorators: [
    (Story) => <ThemeProvider><Story /></ThemeProvider>,
    (Story, context) => {
      return <QueryClientProvider client={context.loaded.queryClient}><Story /></QueryClientProvider>
    }
  ],
  loaders: [mswLoader, () => ({ queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) })],
});

export default preview;
