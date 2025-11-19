import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  CircularProgress,
} from '@material-ui/core';
import React, {
  lazy,
  Suspense, useState,
} from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ActiveLinkContext from '@/components/ActiveLinkContext';
import { AuthenticatedRoute } from '@/components/Auth';

import MainAppBar from './components/MainAppBar';
import MainNav from './components/MainNav';

const AboutView = lazy(() => import('@/views/AboutView'));
const ActivityView = lazy(() => import('@/views/ActivityView'));
const AdminView = lazy(() => import('@/views/AdminView'));
const AdvancedSearchView = lazy(() => import('@/views/AdvancedSearchView'));
const DataView = lazy(() => import('@/views/DataView'));
const GraphView = lazy(() => import('@/views/GraphView'));
const ErrorView = lazy(() => import('@/views/ErrorView'));
const FeedbackView = lazy(() => import('@/views/FeedbackView'));
const ImportPubmedView = lazy(() => import('@/views/ImportPubmedView'));
const NewRecordView = lazy(() => import('@/views/NewRecordView'));
const NewRecordSelectView = lazy(() => import('@/views/NewRecordSelectView'));
const QuickSearch = lazy(() => import('@/views/QuickSearch'));
const RecordView = lazy(() => import('@/views/RecordView'));
const UserProfileView = lazy(() => import('@/views/UserProfileView'));

const ABSTRACT_CLASSES = Object.values(schemaDefn.models)
  .filter((m) => m.isAbstract && m.name !== 'Variant')
  .map((m) => m.name);

type AuthenticatedRouteOptions = {
  admin: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
};

const generateAuthenticatedRoutes = (variants: string[], modelNames: string[], authenticatedRouteOptions: AuthenticatedRouteOptions) => (
  <>
    {
        variants.map((variant) => modelNames.map((modelName) => (
          <Route
            element={(
              <AuthenticatedRoute
                admin={authenticatedRouteOptions.admin}
                component={authenticatedRouteOptions.component}
                componentProps={{ variant, modelName }}
              />
              )}
            path={`/${variant}/${modelName}${variant.toLowerCase() === 'new' ? '' : '/:rid'}`}
          />
        )))
      }
  </>
);

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
const Main = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');

  return (
    <div className="main-view">
      <ActiveLinkContext.Provider value={{ activeLink, setActiveLink }}>
        <MainNav
          isOpen={drawerOpen}
          onChange={({ isOpen }) => {
            setDrawerOpen(isOpen);
          }}
        />
        <MainAppBar
          drawerOpen={drawerOpen}
          onDrawerChange={setDrawerOpen}
          onLinkChange={({ isOpen }) => {
            setDrawerOpen(isOpen);
          }}
        />

        <section className={`main-view__content ${drawerOpen ? 'main-view__content--drawer-open' : ''}`}>
          <Suspense fallback={(<CircularProgress color="secondary" />)}>
            <Routes>
              <Route element={<AuthenticatedRoute component={FeedbackView} />} path="/feedback" />
              <Route element={<ErrorView />} path="/error" />
              <Route element={<AuthenticatedRoute component={AboutView} />} path="/about/*" />
              <Route element={<AuthenticatedRoute component={ActivityView} signedLicenseRequired />} path="/activity" />
              <Route element={<AuthenticatedRoute component={QuickSearch} signedLicenseRequired />} path="/query" />
              <Route element={<AuthenticatedRoute component={AdvancedSearchView} signedLicenseRequired />} path="/query-advanced" />
              {generateAuthenticatedRoutes(['edit'], ['Source', 'source', 'User', 'user', 'UserGroup', 'usergroup'], {
                component: RecordView,
                admin: true,
              })}
              <Route element={<AuthenticatedRoute component={RecordView} componentProps={{ variant: 'edit' }} />} path="/edit/:modelName/:rid" />
              <Route element={<AuthenticatedRoute component={RecordView} componentProps={{ variant: 'view' }} />} path="/view/:modelName/:rid" />
              <Route element={<AuthenticatedRoute component={RecordView} componentProps={{ variant: 'edit' }} />} path="/edit/:rid" />
              <Route element={<AuthenticatedRoute component={RecordView} componentProps={{ variant: 'view' }} />} path="/view/:rid" />
              {generateAuthenticatedRoutes(['new'], ['Source', 'source', 'User', 'user', 'UserGroup', 'usergroup'], {
                component: NewRecordView,
                admin: true,
              })}
              {generateAuthenticatedRoutes(['new'], [...ABSTRACT_CLASSES, ...ABSTRACT_CLASSES.map((m) => m.toLowerCase())], {
                component: NewRecordSelectView,
                admin: false,
              })}
              <Route element={<AuthenticatedRoute component={NewRecordView} />} path="/new/:modelName/:rid" />
              <Route element={<AuthenticatedRoute component={NewRecordView} />} path="/new/:modelName" />
              <Route element={<AuthenticatedRoute component={DataView} />} path="/data/table" />
              <Route element={<AuthenticatedRoute component={GraphView} />} path="/data/graph" />
              <Route element={<AuthenticatedRoute admin component={AdminView} />} path="/admin" />
              <Route element={<AuthenticatedRoute component={ImportPubmedView} />} path="/import/pubmed" />
              <Route element={<AuthenticatedRoute component={UserProfileView} signedLicenseRequired />} path="/user-profile" />
              <Route element={<Navigate to="/query" />} path="/*" />
            </Routes>
          </Suspense>
        </section>
      </ActiveLinkContext.Provider>
    </div>
  );
};

export default Main;
