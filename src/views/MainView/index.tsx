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

const ABSTRACT_CLASSES = Object.values(schemaDefn.schema)
  .filter((m) => m.isAbstract && m.name !== 'Variant')
  .map((m) => m.name);

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
              {/* <AuthenticatedRoute component={ActivityView} path="/activity" />
              <AuthenticatedRoute component={QuickSearch} exact path="/query" />
              <AuthenticatedRoute component={AdvancedSearchView} exact path="/query-advanced" />
              <AuthenticatedRoute
                admin
                component={RecordView}
                path="/:variant(edit)/:modelName(Source|source|User|user|UserGroup|usergroup)/:rid"
              />
              <AuthenticatedRoute component={RecordView} path="/:variant(edit|view)/:modelName/:rid" />
              <AuthenticatedRoute component={RecordView} path="/:variant(edit|view)/:rid" />
              <AuthenticatedRoute
                admin
                component={NewRecordView}
                path="/:variant(new)/:modelName(Source|source|User|user|UserGroup|usergroup)"
              />
              <AuthenticatedRoute
                component={NewRecordSelectView}
                path={`/:variant(new)/:modelName(${
                  [...ABSTRACT_CLASSES, ...ABSTRACT_CLASSES.map((m) => m.toLowerCase())].join('|')
                })`}
              />
              <AuthenticatedRoute component={NewRecordView} path="/:variant(new)/:modelName" />
              <AuthenticatedRoute component={DataView} path="/data/table" />
              <AuthenticatedRoute component={GraphView} path="/data/graph" />
              <AuthenticatedRoute admin component={AdminView} path="/admin" />
              <AuthenticatedRoute component={ImportPubmedView} path="/import/pubmed" />
              <AuthenticatedRoute component={UserProfileView} path="/user-profile" /> */}
              <Route element={<Navigate to="/query" />} path="/" />
            </Routes>
          </Suspense>
        </section>
      </ActiveLinkContext.Provider>
    </div>
  );
};

export default Main;
