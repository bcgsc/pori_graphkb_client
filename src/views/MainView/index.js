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
          isOpen={drawerOpen}
          onChange={({ isOpen, activeLink: updatedLink }) => {
            setDrawerOpen(isOpen);
            setActiveLink(updatedLink);
          }}
          activeLink={activeLink}
        />
        <MainAppBar
          authorizationToken={authorizationToken}
          authenticationToken={authenticationToken}
          onDrawerChange={setDrawerOpen}
          drawerOpen={drawerOpen}
        />
        <section className={`main-view__content ${drawerOpen ? 'main-view__content--drawer-open' : ''}`}>
          <Suspense fallback={(<CircularProgress color="secondary" />)}>
            <Switch>
              <AuthenticatedRoute path="/feedback" component={FeedbackView} />
              <Route path="/login" component={LoginView} />
              <Route exact path="/error" component={ErrorView} />
              <Route path="/about" component={AboutView} />
              <AuthenticatedRoute exact path="/query" component={QueryView} />
              <AuthenticatedRoute path="/query-popular" component={PopularSearchView} />
              <AuthenticatedRoute exact path="/query-advanced" component={AdvancedSearchView} />
              <AuthenticatedRoute
                path="/:variant(edit)/:modelName(Source|source|User|user|UserGroup|usergroup)/:rid"
                admin
                component={RecordView}
              />
              <AuthenticatedRoute path="/:variant(edit|view)/:modelName/:rid" component={RecordView} />
              <AuthenticatedRoute path="/:variant(edit|view)/:rid" component={RecordView} />
              <AuthenticatedRoute
                path="/:variant(new)/:modelName(Source|source|User|user|UserGroup|usergroup)"
                admin
                component={NewRecordView}
              />
              <AuthenticatedRoute path="/:variant(new)/:modelName" component={NewRecordView} />
              <Redirect exact path="/query/advanced" to="/search/v" />
              <AuthenticatedRoute path="/data" component={DataView} />
              <AuthenticatedRoute path="/admin" admin component={AdminView} />
              <Redirect from="/" to="/query" />
            </Switch>
          </Suspense>
        </section>
      </div>
    </KBContext.Provider>
  );
};

export default Main;
