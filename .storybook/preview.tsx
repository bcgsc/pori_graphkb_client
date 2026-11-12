import './preview.css';
import { UserEventObject, fn } from 'storybook/test';
import React, { Suspense, useEffect } from 'react';
import ThemeProvider from '../src/theme';
import addonMsw from 'msw-storybook-addon';
import { QueryClient, QueryClientProvider } from 'react-query';
import '../src/static/graphkb-env-config';
import { HttpResponse, ResponseResolverInfo, http as httpBase, isCommonAssetRequest } from 'msw';
import { setupWorker } from 'msw/browser';
import { GeneralRecordType, QueryBody } from '../src/components/types';
import { Decorator, definePreview, StoryObj } from '@storybook/react-vite';
import addonTest from '@storybook/addon-vitest';
import { Canvas, PreviewAddon } from 'storybook/internal/csf';
import { AppRoutes } from '../src/views/MainView';
import { MemoryRouter, useLocation } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { AuthContext, AuthContextState } from '../src/components/Auth';
import { expect, waitFor, screen } from 'storybook/test';
import { CircularProgress } from '@mui/material';
import ErrorView from '../src/views/ErrorView';

export async function selectOption(canvas: Canvas, userEvent: UserEventObject, label: string | RegExp, optionValue: string | RegExp) {
  const dropdown = await canvas.findByRole('combobox', { name: label });
  await userEvent.click(dropdown);
  const option = await screen.findByRole('option', { name: optionValue });
  await userEvent.click(option);
}

function wrapAsResponse<T extends Record<string, any> | any[]>(maybeResponse: T | HttpResponse<T>): HttpResponse<T> {
  if (maybeResponse instanceof Response) {
    return maybeResponse;
  }
  return HttpResponse.json(maybeResponse);
}

type AllowedResponse = Record<string, any> | any[] | HttpResponse<any>;
type MaybePromise<T> = T | Promise<T>;

export const http = {
  ...httpBase,
  gkb: {
    get: (url: `/api/${string}`, resolver: (info: ResponseResolverInfo<any>) => MaybePromise<AllowedResponse>) => {
      return httpBase.get(`${window._env_.API_BASE_URL}${url}`, async (info) => {
        return wrapAsResponse(await resolver(info));
      })
    },
    post: (url: `/api/${string}`, resolver: (body: any, info: ResponseResolverInfo<any>) => MaybePromise<AllowedResponse>, spy?: ReturnType<typeof fn>) => {
      return httpBase.post(`${window._env_.API_BASE_URL}${url}`, async (info) => {
        const body = await info.request.clone().json();
        spy?.('POST', url, body);
        return wrapAsResponse(await resolver(body, info));
      })
    },
    delete: (url: `/api/${string}`, resolver: (info: ResponseResolverInfo<any>) => MaybePromise<AllowedResponse>, spy?: ReturnType<typeof fn>) => {
      return httpBase.delete(`${window._env_.API_BASE_URL}${url}`, async (info) => {
        spy?.('DELETE', url);
        return wrapAsResponse(await resolver(info));
      })
    },
    query: (resolver: (body: QueryBody) => (HttpResponse<Partial<GeneralRecordType>> | HttpResponse<{ message?: string }> | Partial<GeneralRecordType>[])) => http.gkb.post('/api/query', resolver)
  }
}

const setupMsw = async () => {
  const worker = setupWorker();
  await worker.start({
    onUnhandledRequest: (request, print) => {
      if (request.url.startsWith(window._env_.API_BASE_URL) && !isCommonAssetRequest(request)) {
        print.error();
      }
    },
    quiet: typeof process !== 'undefined' && process.env
      ? process.env.NODE_ENV === 'test' || process.env.CI === 'true'
      : false,
  });
  return worker;
};

const snapshotAddon = () => ({}) as PreviewAddon<{ parameters: { snapshot?: boolean } }>;

const preview = definePreview({
  addons: [addonTest(), addonMsw(setupMsw), snapshotAddon()],
  parameters: {
    snapshot: true,
  },
  decorators: [
    (Story) => <ThemeProvider><Story /></ThemeProvider>,
    (Story, context) => {
      return <QueryClientProvider client={context.loaded.queryClient}><Story /></QueryClientProvider>
    }
  ],
  loaders: [() => ({ queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) })],
});

export async function hasFinishedLoading({
  step,
  canvas,
  // must exceed the longest debounce that can trigger a fetch (e.g. ag-grid blocks, search inputs)
  settleMs = 500,
}: Pick<Parameters<NonNullable<StoryObj['play']>>[0], 'step' | 'canvas'> & { settleMs?: number }) {
  await step('Finished Loading', async () => {
    let idleSince: number | null = null;
    await waitFor(async () => {
      const progressBars = canvas.queryAllByRole('progressbar');
      // ag-grid's screen-reader announcement can retain stale "Loading..." text after rows load
      const loadingMessages = canvas.queryAllByText(/loading\.\.\./i, { ignore: 'script, style, .ag-aria-description-container' });
      if (progressBars.length || loadingMessages.length) {
        idleSince = null;
      } else {
        idleSince ??= Date.now();
      }
      await expect(progressBars, 'has no progress bars').toHaveLength(0);
      await expect(loadingMessages, 'has no loading messages').toHaveLength(0);
      await expect(Date.now() - idleSince!, 'loading state has settled').toBeGreaterThanOrEqual(settleMs);
    }, { timeout: 30000, interval: 50 });
  });
}

export const withSnackbar: Decorator = (Story) => <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Story /></SnackbarProvider>;

interface WithAuthArgs {
  auth?: Omit<Partial<AuthContextState>, 'user'> & { user?: Partial<AuthContextState['user']> };
}

export const DEFAULT_USER_RECORD = {
  signedLicenseAt: new Date(2020, 0, 1).getTime(),
  name: 'bmonkeys',
  groups: [],
  '@rid': '#1:1',
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
          ...DEFAULT_USER_RECORD,
          ...auth?.user
        },
    }
    return (
          <AuthContext.Provider value={authState}>
            <Story />
          </AuthContext.Provider>
    )
};


interface LocationSpyProps {
  onLocationChange?: (location: { pathname: string; search: string }, state: { state: unknown }) => void
}

function LocationSpy({ onLocationChange }: LocationSpyProps) {
  const location = useLocation();
  useEffect(() => {
    onLocationChange?.({
      search: location.search,
      pathname: location.pathname,
    }, { state: location.state });
  }, [location, onLocationChange]);
  return null;
}

type WithRouterArgs = {
  path?: string;
} & LocationSpyProps;

export const withRouter: Decorator<WithRouterArgs> = (Story, { args }) => {
  const { path = '/' } = args;
  return (
    <MemoryRouter initialEntries={[path]}>
      <LocationSpy onLocationChange={args.onLocationChange} />
      <Story />
    </MemoryRouter>
  )
}

type ViewArgs  = WithAuthArgs & WithRouterArgs & { onRequestSpy?: ReturnType<typeof fn> };

export interface ViewPreviewType {
  args: ViewArgs;
}

function View() {
  return (
      <div style={{height: '100%', minWidth: '300px'}}>
        <ErrorView>
          <Suspense fallback={(<CircularProgress color="secondary" />)}>
            <AppRoutes />
          </Suspense>
        </ErrorView>
      </div>
  )
}

export const view = {
  args: {
    onRequestSpy: fn(),
  },
  component: View,
  play: hasFinishedLoading,
  parameters: {
    layout: 'fullscreen' as const,
  },
  beforeEach({ msw }) {
    msw.use( http.gkb.query(() => []));
  },
  decorators: [withSnackbar, withAuth, withRouter],
}


export default preview;
