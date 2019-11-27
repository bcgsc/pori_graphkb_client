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
import {
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';

import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import { KBContext } from '@/components/KBContext';
import config from '@/static/config';

import MainAppBar from './components/MainAppBar';
import MainNav from './components/MainNav';

const AboutView = lazy(() => import('@/views/AboutView'));
const AdminView = lazy(() => import('@/views/AdminView'));
const AdvancedSearchView = lazy(() => import('@/views/AdvancedSearchView'));
const DataView = lazy(() => import('@/views/DataView'));
const ErrorView = lazy(() => import('@/views/ErrorView'));
const FeedbackView = lazy(() => import('@/views/FeedbackView'));
const ImportPubmedView = lazy(() => import('@/views/ImportPubmedView'));
const LoginView = lazy(() => import('@/views/LoginView'));
const NewRecordView = lazy(() => import('@/views/NewRecordView'));
const PopularSearchView = lazy(() => import('@/views/PopularSearchView'));
const QueryView = lazy(() => import('@/views/QueryView'));
const RecordView = lazy(() => import('@/views/RecordView'));

const {
  API_BASE_URL,
} = config;


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
        if (fetchUrl.startsWith(API_BASE_URL)) {
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
    <KBContext.Provider value={{
      authorizationToken, authenticationToken, setAuthorizationToken, setAuthenticationToken,
    }}
    >
      <div className="main-view">
        <MainNav
          activeLink={activeLink}
          isOpen={drawerOpen}
          onChange={({ isOpen, activeLink: updatedLink }) => {
            setDrawerOpen(isOpen);
            setActiveLink(updatedLink);
          }}
        />
        <MainAppBar
          authenticationToken={authenticationToken}
          authorizationToken={authorizationToken}
          drawerOpen={drawerOpen}
          onDrawerChange={setDrawerOpen}
        />
        <section className={`main-view__content ${drawerOpen ? 'main-view__content--drawer-open' : ''}`}>
          <Suspense fallback={(<CircularProgress color="secondary" />)}>
            <Switch>
              <AuthenticatedRoute component={FeedbackView} path="/feedback" />
              <Route component={LoginView} path="/login" />
              <Route component={ErrorView} exact path="/error" />
              <AuthenticatedRoute component={AboutView} path="/about" />
              <AuthenticatedRoute component={QueryView} exact path="/query" />
              <AuthenticatedRoute component={PopularSearchView} path="/query-popular" />
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
              <AuthenticatedRoute component={NewRecordView} path="/:variant(new)/:modelName" />
              <Redirect exact path="/query/advanced" to="/search/v" />
              <AuthenticatedRoute component={DataView} path="/data" />
              <AuthenticatedRoute admin component={AdminView} path="/admin" />
              <AuthenticatedRoute component={ImportPubmedView} path="/import/pubmed" />
              <Redirect from="/" to="/query" />
            </Switch>
          </Suspense>
        </section>
      </div>
    </KBContext.Provider>
  );
};

export default Main;
