import React, { useState } from 'react';
import PropTypes from 'prop-types';
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
import {
  DiseaseSearch,
  DrugSearch,
  GeneSearch,
  VariantSearch,
} from './components';
import './index.scss';

function PopularSearchView(props) {
  const baseUri = '/popular_query';
  const { location: { pathname: currentUri } } = props;

  const tabsList = [
    { label: 'Gene', component: GeneSearch },
    { label: 'Variant', component: VariantSearch },
    { label: 'Disease', component: DiseaseSearch },
    { label: 'Drug', component: DrugSearch },
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
      component={component}
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
  location: PropTypes.object.isRequired,
};

export default PopularSearchView;
