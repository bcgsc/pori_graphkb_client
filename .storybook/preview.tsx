import React, { Suspense } from 'react';
import ThemeProvider from '../src/theme';
import { initialize, mswLoader, getWorker } from 'msw-storybook-addon'
import { QueryClient, QueryClientProvider } from 'react-query';
import '../src/static/graphkb-env-config';
import { HttpResponse, ResponseResolverInfo, http as httpBase, isCommonAssetRequest } from 'msw';
import { GeneralRecordType, QueryBody } from '../src/components/types';
import { Decorator, definePreview, StoryObj } from '@storybook/react-vite';
import addonTest from '@storybook/addon-vitest';
import { MswParameters } from 'msw-storybook-addon'
import { PreviewAddon } from 'storybook/internal/csf';
import { AppRoutes } from '../src/views/MainView';
import { MemoryRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AuthContext, AuthContextState } from '../src/components/Auth';
import { expect, waitFor } from 'storybook/test';
import { CircularProgress } from '@mui/material';

function wrapAsResponse<T extends Record<string, any> | any[]>(maybeResponse: T | HttpResponse<T>): HttpResponse<T> {
  if (maybeResponse instanceof Response) {
    return maybeResponse;
  }
  return HttpResponse.json(maybeResponse);
}

type AllowedResponse = Record<string, any> | any[] | HttpResponse<any>;

export const http = {
  ...httpBase,
  gkb: {
    get: (url: `/api/${string}`, resolver: (info: ResponseResolverInfo<any>) => AllowedResponse) => {
      return httpBase.get(`${window._env_.API_BASE_URL}${url}`, (info) => {
        return wrapAsResponse(resolver(info));
      })
    },
    post: (url: `/api/${string}`, resolver: (body: any, info: ResponseResolverInfo<any>) => AllowedResponse) => {
      return httpBase.post(`${window._env_.API_BASE_URL}${url}`, async (info) => {
        const body = await info.request.clone().json();
        return wrapAsResponse(resolver(body, info));
      })
    },
    query: (resolver: (body: QueryBody) => (HttpResponse<Partial<GeneralRecordType>[]> | Partial<GeneralRecordType>[])) => http.gkb.post('/api/query', resolver)
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

export async function hasFinishedLoading({ step, canvas }: Pick<Parameters<NonNullable<StoryObj['play']>>[0], 'step' | 'canvas'>) {
  await step('Finished Loading', async () => {
    await waitFor(async () => {
      await expect(canvas.queryAllByRole('progressbar')).toHaveLength(0);
      await expect(canvas.queryAllByText(/loading\.\.\./i)).toHaveLength(0);
    }, { timeout: 10000 });
  });
}

export const withSnackbar: Decorator = (Story) => <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Story /></SnackbarProvider>;

interface WithAuthArgs {
  auth?: Omit<Partial<AuthContextState>, 'user'> & { user?: Partial<AuthContextState['user']> };
}

export const withAuth: Decorator<WithAuthArgs> = (Story, { args }) => {
    const auth = args.auth;
    const authState: AuthContextState = {
      login: () => { },
      logout: () => { },
      isAuthenticating: false,
      isAuthenticated: true,
      isAdmin: false,
      hasWriteAccess: false,
      error: undefined,
      ...auth,
      user: auth?.user === null ? undefined : {
        signedLicenseAt: new Date(2020, 0, 1).getTime(),
        name: 'bmonkeys',
        groups: [],
        '@rid': '#1:1',
        ...auth?.user
      },
    }
    return (
          <AuthContext.Provider value={authState}>
            <Story />
          </AuthContext.Provider>
    )
};

interface WithRouterArgs {
  path?: string;
}

export const withRouter: Decorator<WithRouterArgs> = (Story, { args }) => {
  const { path = '/' } = args;
    return (
      <MemoryRouter initialEntries={[path]}>
        <Story />
      </MemoryRouter>
    )
}

type ViewArgs  = WithAuthArgs & WithRouterArgs;

export interface ViewPreviewType {
  args: ViewArgs;
}

function View() {
  return (
      <div style={{height: '100%', minWidth: '300px'}}>
          <Suspense fallback={(<CircularProgress color="secondary" />)}>
            <AppRoutes />
          </Suspense>
      </div>
  )
}

export const view = {
  component: View,
  play: hasFinishedLoading,
  parameters: {
    layout: 'fullscreen' as const,
    msw: {
      handlers: [http.gkb.query(() => [])]
    }
  },
  decorators: [withSnackbar, withAuth, withRouter],
}


export default preview;
