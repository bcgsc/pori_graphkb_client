import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  CircularProgress,
} from '@mui/material';
import React, {
  lazy,
  Suspense, useState,
} from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { AuthenticatedLayout } from '@/components/Auth';
import { FORM_VARIANT } from '@/components/util';

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

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ErrorView />} path="/error" />
      <Route element={<AuthenticatedLayout />}>
        <Route Component={FeedbackView} path="/feedback" />
        <Route Component={AboutView} path="/about/*" />
        <Route element={<AuthenticatedLayout signedLicenseRequired />}>
          <Route Component={ActivityView} path="/activity" />
          <Route Component={QuickSearch} path="/query" />
          <Route Component={AdvancedSearchView} path="/query-advanced" />
          <Route Component={UserProfileView} path="/user-profile" />
          <Route element={<AuthenticatedLayout admin />}>
            <Route Component={AdminView} path="/admin" />
            <Route element={<RecordView modelName="Source" variant={FORM_VARIANT.EDIT} />} path="/edit/Source/:rid" />
            <Route element={<NewRecordView modelName="Source" />} path="/new/Source" />
            <Route element={<RecordView modelName="User" variant={FORM_VARIANT.EDIT} />} path="/edit/User/:rid" />
            <Route element={<NewRecordView modelName="User" />} path="/new/User" />
            <Route element={<RecordView modelName="UserGroup" variant={FORM_VARIANT.EDIT} />} path="/edit/UserGroup/:rid" />
            <Route element={<NewRecordView modelName="UserGroup" />} path="/new/UserGroup" />
          </Route>
          <Route element={<RecordView variant={FORM_VARIANT.EDIT} />} path="/edit/:modelName/:rid" />
          <Route element={<RecordView variant={FORM_VARIANT.VIEW} />} path="/view/:modelName/:rid" />
          <Route element={<RecordView variant={FORM_VARIANT.EDIT} />} path="/edit/:rid" />
          <Route element={<RecordView variant={FORM_VARIANT.VIEW} />} path="/view/:rid" />
          {ABSTRACT_CLASSES.map((modelName) => (
            <Route key={modelName} element={<NewRecordSelectView modelName={modelName} />} path={`/new/${modelName}`} />
          ))}
          <Route Component={NewRecordView} path="/new/:modelName/:rid" />
          <Route Component={NewRecordView} path="/new/:modelName" />
          <Route Component={DataView} path="/data/table" />
          <Route Component={GraphView} path="/data/graph" />
          <Route Component={ImportPubmedView} path="/import/pubmed" />
        </Route>
      </Route>
      <Route element={<Navigate to="/query" />} path="/*" />
    </Routes>
  );
}

/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
const Main = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        <Suspense fallback={(<CircularProgress color="secondary" />)}>
          <AppRoutes />
        </Suspense>
      </section>
    </div>
  );
};

export default Main;
