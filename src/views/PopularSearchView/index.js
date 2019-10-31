import React, { useState } from 'react';
import {
  NavLink,
  Route,
  Switch,
} from 'react-router-dom';
import {
  Tabs,
  Tab,
} from '@material-ui/core';
import slugify from 'slugify';


import BasePopularSearch from './components/BasePopularSearch';
import './index.scss';
import { LocationPropType } from '../../components/prop-type-models';

/**
 * Main view for popular search. Displays top level query option tabs. This view
 * should house common/frequently used searches that the analysts use.
 *
 * @property {string} currentUri parses URI to determine which search variant to render
 */
function PopularSearchView(props) {
  const baseUri = '/query-popular';
  const { location: { pathname: currentUri } } = props;

  const tabsList = [
    { label: 'Gene', component: () => <BasePopularSearch variant="GENE" /> },
    { label: 'Variant', component: () => <BasePopularSearch variant="VARIANT" /> },
    { label: 'Disease', component: () => <BasePopularSearch variant="DISEASE" /> },
    { label: 'Drug', component: () => <BasePopularSearch variant="DRUG" /> },
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
      label={label}
      component={NavLink}
      key={label}
      value={index}
      to={uri}
    />
  ));

  const tabsRouteList = tabsList.map(({ uri, label, component }) => (
    <Route
      label={label}
      key={label}
      render={component}
      exact
      path={uri}
    />
  ));

  return (
    <div className="popular-search">
      <Tabs
        value={tabIndex}
        onChange={(event, value) => setTabIndex(value)}
        centered
        className="tabs-bar"
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
  location: LocationPropType.isRequired,
};

export default PopularSearchView;
