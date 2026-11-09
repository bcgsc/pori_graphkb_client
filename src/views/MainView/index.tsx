import './index.scss';

import {
  CircularProgress,
} from '@mui/material';
import React, {
  lazy,
  Suspense, useState,
} from 'react';
import { Navigate, useRoutes } from 'react-router';

import { AuthenticatedLayout } from '@/components/Auth';
import { FORM_VARIANT } from '@/components/util';
import schema from '@/services/schema';
import ErrorBoundary from '@/views/ErrorView';

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
const AdvancedSearchView = lazy(() => import('@/views/AdvancedSearchView'));
const DataView = lazy(() => import('@/views/DataView'));
const GraphView = lazy(() => import('@/views/GraphView'));
const FeedbackView = lazy(() => import('@/views/FeedbackView'));
const ImportPubmedView = lazy(() => import('@/views/ImportPubmedView'));
const NewRecordView = lazy(() => import('@/views/NewRecordView'));
const NewRecordSelectView = lazy(() => import('@/views/NewRecordSelectView'));
const QuickSearch = lazy(() => import('@/views/QuickSearch'));
const RecordView = lazy(() => import('@/views/RecordView'));
const UserProfileView = lazy(() => import('@/views/UserProfileView'));

const ABSTRACT_CLASSES = Object.values(schema.models)
  .filter((m) => m.isAbstract)
  .map((m) => m.name);

export const appRoutes = [
  {
    element: <AuthenticatedLayout />,
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
            element: <AuthenticatedLayout signedLicenseRequired />,
            children: [
              { path: 'classes', Component: AboutViewClassesTab },
              { path: 'matching', Component: AboutViewMatchingTab },
            ],
          },
        ],
      },
      {
        element: <AuthenticatedLayout signedLicenseRequired />,
        children: [
          { path: '/activity', Component: ActivityView },
          { path: '/query', Component: QuickSearch },
          { path: '/query-advanced', Component: AdvancedSearchView },
          { path: '/user-profile', Component: UserProfileView },
          {
            element: <AuthenticatedLayout admin />,
            children: [
              { path: '/admin', Component: AdminView },
              { path: '/edit/Source/:rid', element: <RecordView modelName="Source" variant={FORM_VARIANT.EDIT} /> },
              { path: '/new/Source', element: <NewRecordView modelName="Source" /> },
              { path: '/edit/User/:rid', element: <RecordView modelName="User" variant={FORM_VARIANT.EDIT} /> },
              { path: '/new/User', element: <NewRecordView modelName="User" /> },
              { path: '/edit/UserGroup/:rid', element: <RecordView modelName="UserGroup" variant={FORM_VARIANT.EDIT} /> },
              { path: '/new/UserGroup', element: <NewRecordView modelName="UserGroup" /> },
            ],
          },
          {
            path: '/edit/:modelName/:rid',
            element: <RecordView variant={FORM_VARIANT.EDIT} />,
          },
          {
            path: '/view/:modelName/:rid',
            element: <RecordView variant={FORM_VARIANT.VIEW} />,
          },
          {
            path: '/edit/:rid',
            element: <RecordView variant={FORM_VARIANT.EDIT} />,
          },
          {
            path: '/view/:rid',
            element: <RecordView variant={FORM_VARIANT.VIEW} />,
          },
          ...ABSTRACT_CLASSES.map((modelName) => ({
            path: `/new/${modelName}`,
            element: <NewRecordSelectView modelName={modelName} />,
          })),
          { path: '/new/:modelName/:rid', Component: NewRecordView },
          { path: '/new/:modelName', Component: NewRecordView },
          { path: '/data/table', Component: DataView },
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
  const routes = useRoutes(appRoutes);

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
        <ErrorBoundary>
          <Suspense fallback={(<CircularProgress color="secondary" />)}>
            {routes}
          </Suspense>
        </ErrorBoundary>
      </section>
    </div>
  );
};

export default Main;
