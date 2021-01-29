/**
 * @module /Main
 */
import './index.scss';

import {
  CircularProgress,
} from '@material-ui/core';
import fetchIntercept from 'fetch-intercept';
import React, {
  lazy,
  Suspense, useEffect, useState,
} from 'react';
import { ReactQueryConfigProvider } from 'react-query';
import {
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';

import ActiveLinkContext from '@/components/ActiveLinkContext';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import { SecurityContext } from '@/components/SecurityContext';
import schema from '@/services/schema';
import config from '@/static/config';

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
const LoginView = lazy(() => import('@/views/LoginView'));
const NewRecordView = lazy(() => import('@/views/NewRecordView'));
const NewRecordSelectView = lazy(() => import('@/views/NewRecordSelectView'));
const QuickSearch = lazy(() => import('@/views/QuickSearch'));
const RecordView = lazy(() => import('@/views/RecordView'));
const UserProfileView = lazy(() => import('@/views/UserProfileView'));


const ABSTRACT_CLASSES = Object.values(schema.schema)
  .filter(m => m.isAbstract && m.name !== 'Variant')
  .map(m => m.name);


/**
 * Entry point to application. Handles routing, app theme, and logged in state.
 */
const Main = () => {
  const [authorizationToken, setAuthorizationToken] = useState('');
  const [authenticationToken, setAuthenticationToken] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    const unregister = fetchIntercept.register({
      request: (fetchUrl, fetchConfig) => {
        if (fetchUrl.startsWith(window._env_.API_BASE_URL)) {
          const newConfig = { ...fetchConfig };

          if (!newConfig.headers) {
            newConfig.headers = {};
          }
          newConfig.headers.Authorization = authorizationToken;
          return [fetchUrl, newConfig];
        }
        return [fetchUrl, fetchConfig];
      },
    });
    return unregister;
  }, [authorizationToken]);

  return (
    <SecurityContext.Provider value={{
      authorizationToken, authenticationToken, setAuthorizationToken, setAuthenticationToken,
    }}
    >
      <ReactQueryConfigProvider config={{
        staleTime: 15 * 60 * 1000, // 15m
        refetchAllOnWindowFocus: false,
        refetchOnWindowFocus: false,
        throwOnError: true,
        refetchOnMount: false,
      }}
      >
        <div className="main-view">
          <ActiveLinkContext.Provider value={{ activeLink, setActiveLink }}>
            <MainNav
              isOpen={drawerOpen}
              onChange={({ isOpen }) => {
                setDrawerOpen(isOpen);
              }}
            />
            <MainAppBar
              authenticationToken={authenticationToken}
              authorizationToken={authorizationToken}
              drawerOpen={drawerOpen}
              onDrawerChange={setDrawerOpen}
              onLinkChange={({ isOpen }) => {
                setDrawerOpen(isOpen);
              }}
            />

            <section className={`main-view__content ${drawerOpen ? 'main-view__content--drawer-open' : ''}`}>
              <Suspense fallback={(<CircularProgress color="secondary" />)}>
                <Switch>
                  <AuthenticatedRoute component={FeedbackView} path="/feedback" />
                  <Route component={LoginView} path="/login" />
                  <Route component={ErrorView} exact path="/error" />
                  <AuthenticatedRoute component={AboutView} path="/about" />
                  <AuthenticatedRoute component={ActivityView} path="/activity" />
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
                      [...ABSTRACT_CLASSES, ...ABSTRACT_CLASSES.map(m => m.toLowerCase())].join('|')
                    })`}
                  />
                  <AuthenticatedRoute component={NewRecordView} path="/:variant(new)/:modelName" />
                  <AuthenticatedRoute component={DataView} path="/data/table" />
                  <AuthenticatedRoute component={GraphView} path="/data/graph" />
                  <AuthenticatedRoute admin component={AdminView} path="/admin" />
                  <AuthenticatedRoute component={ImportPubmedView} path="/import/pubmed" />
                  <AuthenticatedRoute component={UserProfileView} path="/user-profile" />
                  <Redirect from="/" to="/query" />
                </Switch>
              </Suspense>
            </section>
          </ActiveLinkContext.Provider>
        </div>
      </ReactQueryConfigProvider>
    </SecurityContext.Provider>
  );
};

export default Main;
