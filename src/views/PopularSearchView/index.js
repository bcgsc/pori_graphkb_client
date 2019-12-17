import './index.scss';

import {
  Tab,
  Tabs,
} from '@material-ui/core';
import React, { useCallback, useState } from 'react';
import {
  NavLink,
  Route,
  Switch,
} from 'react-router-dom';
import slugify from 'slugify';

import { HistoryPropType, LocationPropType } from '@/components/types';
import handleErrorSaveLocation from '@/services/util';

import BasePopularSearch from './components/BasePopularSearch';

/**
 * Main view for popular search. Displays top level query option tabs. This view
 * should house common/frequently used searches that the analysts use.
 *
 * @property {string} currentUri parses URI to determine which search variant to render
 */
function PopularSearchView(props) {
  const baseUri = '/query-popular';
  const { location: { pathname: currentUri }, history } = props;

  const onError = useCallback((error = {}) => {
    handleErrorSaveLocation(error, history);
  }, [history]);

  const onSubmit = useCallback((search = '') => {
    if (search) {
      history.push(`/data/table?${search}`, { search });
    } else {
      history.push('/');
    }
  }, [history]);

  const LoadedSearch = variant => (<BasePopularSearch onError={onError} onSubmit={onSubmit} variant={variant} />);

  const tabsList = [
    { label: 'Gene', component: () => LoadedSearch('GENE') },
    { label: 'Variant', component: () => LoadedSearch('VARIANT') },
    { label: 'Disease', component: () => LoadedSearch('DISEASE') },
    { label: 'Drug', component: () => LoadedSearch('DRUG') },
  ];

  const uriLookup = {};


  tabsList.forEach((tab, index) => {
    if (tab.slug === undefined) {
      const slug = `/${slugify(tab.label).toLowerCase()}`;
      tab.uri = `${baseUri}${slug}`;
      uriLookup[tab.uri] = index;
    }
  });

  const currentTab = uriLookup[currentUri] === undefined ? 0 : uriLookup[currentUri];

  const [tabIndex, setTabIndex] = useState(currentTab);

  const tabNavList = tabsList.map(({ uri, label }, index) => (
    <Tab
      key={label}
      component={NavLink}
      label={label}
      to={uri}
      value={index}
    />
  ));

  const tabsRouteList = tabsList.map(({ uri, label, component }) => (
    <Route
      key={label}
      component={component}
      exact
      label={label}
      path={uri}
    />
  ));

  return (
    <div className="popular-search">
      <Tabs
        centered
        className="tabs-bar"
        onChange={(event, value) => setTabIndex(value)}
        value={tabIndex}
      >
        {tabNavList}
      </Tabs>
      <div className="tabs-content">
        <Switch>
          {tabsRouteList}
        </Switch>
      </div>
    </div>
  );
}

PopularSearchView.propTypes = {
  history: HistoryPropType.isRequired,
  location: LocationPropType.isRequired,
};

export default PopularSearchView;
