import './index.scss';

import {
  CircularProgress,
} from '@mui/material';
import React, {
  lazy,
  Suspense, useState,
} from 'react';
import type { LoaderFunctionArgs, RouteObject } from 'react-router';
import {
  Navigate, Outlet, useLoaderData, useNavigation,
} from 'react-router';

import { AuthContext, authContext, createAuthMiddleware } from '@/components/Auth';
import { FORM_VARIANT } from '@/components/util';
import ErrorBoundary, { RouteErrorBoundary } from '@/views/ErrorView';
import { createRecordLoader } from '@/views/RecordView/loader';

import MainAppBar from './components/MainAppBar';
import MainNav from './components/MainNav';

const AboutView = lazy(() => import('@/views/AboutView'));
const AboutViewMainTab = lazy(() => import('@/views/AboutView/components/AboutMain'));
const AboutViewClassesTab = lazy(() => import('@/views/AboutView/components/AboutClasses'));
const AboutViewGettingStartedTab = lazy(() => import('@/views/AboutView/components/GettingStarted'));
const AboutViewTermsTab = lazy(() => import('@/views/AboutView/components/AboutUsageTerms'));
const AboutViewMatchingTab = lazy(() => import('@/views/AboutView/components/Matching'));
const AboutViewNotationTab = lazy(() => import('@/views/AboutView/components/Notation'));
const ActivityView = lazy(() => import('@/views/ActivityView'));
const AdminView = lazy(() => import('@/views/AdminView'));
const GraphView = lazy(() => import('@/views/GraphView'));
const FeedbackView = lazy(() => import('@/views/FeedbackView'));
const ImportPubmedView = lazy(() => import('@/views/ImportPubmedView'));
const QuickSearch = lazy(() => import('@/views/QuickSearch'));
const RecordView = lazy(() => import('@/views/RecordView'));
const UserProfileView = lazy(() => import('@/views/UserProfileView'));

const withAuth = (Component: React.ComponentType) => () => {
  const auth = useLoaderData<typeof authLoader>()!;
  return (
    <AuthContext.Provider value={auth}><Component /></AuthContext.Provider>
  );
};

const authLoader = ({ context }: LoaderFunctionArgs) => {
  const auth = context.get(authContext);
  return auth;
};

export const createRoutes = (MainAuthLayout?: React.ComponentType): RouteObject[] => [
  {
    Component: withAuth(MainAuthLayout ?? Outlet),
    loader: authLoader,
    HydrateFallback: CircularProgress,
    ErrorBoundary: RouteErrorBoundary,
    middleware: [createAuthMiddleware()],
    children: [
      {
        path: '/feedback',
        Component: FeedbackView,
      },
      {
        path: '/about',
        Component: AboutView,
        children: [
          { index: true, Component: AboutViewMainTab },
          { path: 'getting-started', Component: AboutViewGettingStartedTab },
          { path: 'notation', Component: AboutViewNotationTab },
          { path: 'terms', Component: AboutViewTermsTab },
          {
            middleware: [createAuthMiddleware({ requireSignedLicense: true })],
            ErrorBoundary: RouteErrorBoundary,
            children: [
              { path: 'classes', Component: AboutViewClassesTab },
              { path: 'matching', Component: AboutViewMatchingTab },
            ],
          },
        ],
      },
      {
        middleware: [createAuthMiddleware({ requireSignedLicense: true })],
        children: [
          { path: '/activity', Component: ActivityView },
          { path: '/query', Component: QuickSearch },
          { path: '/query-advanced', lazy: () => import('@/views/AdvancedSearchView') },
          { path: '/user-profile', Component: UserProfileView },
          { path: '/admin', Component: AdminView, middleware: [createAuthMiddleware({ requireAdmin: true })] },
          {
            path: '/edit/:modelName/:rid',
            Component: RecordView,
            loader: createRecordLoader(FORM_VARIANT.EDIT),
          },
          {
            path: '/view/:modelName/:rid',
            Component: RecordView,
            loader: createRecordLoader(FORM_VARIANT.VIEW),
          },
          {
            path: '/edit/:rid',
            Component: RecordView,
            loader: createRecordLoader(FORM_VARIANT.EDIT),
          },
          {
            path: '/view/:rid',
            Component: RecordView,
            loader: createRecordLoader(FORM_VARIANT.VIEW),
          },
          {
            path: '/new/:modelName/:rid',
            Component: RecordView,
            loader: createRecordLoader(FORM_VARIANT.NEW),
          },
          {
            path: '/new/:modelName',
            Component: RecordView,
            loader: createRecordLoader(FORM_VARIANT.NEW),
          },
          { path: '/data/table', lazy: () => import('@/views/DataView') },
          { path: '/data/graph', Component: GraphView },
          { path: '/import/pubmed', Component: ImportPubmedView },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/query" />,
  },
];

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
const Main = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigation = useNavigation();

  return (
    <div className="main-view">
      <MainNav
        isOpen={drawerOpen}
        onChange={({ isOpen }) => {
          setDrawerOpen(isOpen);
        }}
      />
      <MainAppBar
        drawerOpen={drawerOpen}
        onDrawerChange={setDrawerOpen}
      />
      <section className={`main-view__content ${drawerOpen ? 'main-view__content--drawer-open' : ''}`}>
        {navigation.state === 'loading' && <CircularProgress color="secondary" />}
        <ErrorBoundary>
          <Suspense fallback={(<CircularProgress color="secondary" />)}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </section>
    </div>
  );
};

export default Main;
