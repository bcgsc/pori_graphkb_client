/**
 * @module /Main
 */
import React, {
  useState, useEffect, Suspense, lazy,
} from 'react';
import {
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import {
  CircularProgress,
} from '@material-ui/core';
import fetchIntercept from 'fetch-intercept';

import config from '../../static/config';

import './Main.scss';
import {
  AboutView,
  AdminView,
  AdvancedSearchView,
  DataView,
  ErrorView,
  FeedbackView,
  LoginView,
  QueryView,
  PopularSearchView,
} from '..';

import { KBContext } from '../../components/KBContext';
import AppBar from './components/AppBar';
import MainNav from './components/MainNav';
import AuthenticatedRoute from '../../components/AuthenticatedRoute';

import RecordView from '../RecordView';
import NewRecordView from '../NewRecordView';

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
        <AppBar
          authorizationToken={authorizationToken}
          authenticationToken={authenticationToken}
          onDrawerChange={setDrawerOpen}
          drawerOpen={drawerOpen}
        />
        <section className={`main-view__content ${drawerOpen ? 'main-view__content--drawer-open' : ''}`}>
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
        </section>
      </div>
    </KBContext.Provider>
  );
};

export default Main;
