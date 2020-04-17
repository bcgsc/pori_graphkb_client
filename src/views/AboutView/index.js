import './index.scss';

import {
  Tab,
  Tabs,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import {
  NavLink,
  Route,
  Switch,
} from 'react-router-dom';
import slugify from 'slugify';

import { LocationPropType } from '@/components/types';

import AboutClasses from './components/AboutClasses';
import AboutForms from './components/AboutForms';
import AboutGraphView from './components/AboutGraphView';
import AboutMain from './components/AboutMain';
import AboutNotation from './components/AboutNotation';
import AboutQuerying from './components/AboutQuerying';
import AboutStatements from './components/AboutStatements';
import AboutUsageTerms from './components/AboutUsageTerms';


const AboutView = (props) => {
  const { location: { pathname: currentUri } } = props;
  const [tabIndex, setTabIndex] = useState(0);

  const baseUri = '/about';
  const tabsList = [
    { label: 'About', component: AboutMain },
    { label: 'Statements', component: AboutStatements },
    { label: 'Classes', component: AboutClasses },
    { label: 'Query', component: AboutQuerying },
    { label: 'Graph View', component: AboutGraphView },
    { label: 'Input Data', component: AboutForms },
    { label: 'Notation', component: AboutNotation },
    { label: 'Terms', component: AboutUsageTerms },
  ];

  const uriLookup = {};

  tabsList.forEach((tab, index) => {
    if (tab.slug === undefined) {
      const slug = index === 0 ? '' : `/${slugify(tab.label).toLowerCase()}`;
      tab.uri = `${baseUri}${slug}`;
      uriLookup[tab.uri] = index;
    }
  });

  useEffect(() => {
    setTabIndex(uriLookup[currentUri]);
  }, [uriLookup, currentUri]);


  const handleTabChange = (event, value) => {
    setTabIndex(value);
  };

  return (
    <div className="about-page">
      <Tabs className="tabs-bar" onChange={handleTabChange} value={tabIndex} variant="scrollable">
        {tabsList.map(({ uri, label }, index) => (
          <Tab
            key={label}
            component={NavLink}
            label={label}
            to={uri}
            value={index}
          />
        ))}
      </Tabs>
      <div className="tabs-content">
        <Switch>
          {tabsList.map(({ uri, label, component }) => (
            <Route
              key={label}
              component={component}
              exact
              label={label}
              path={uri}
            />
          ))}
        </Switch>
      </div>
    </div>
  );
};


AboutView.propTypes = {
  location: LocationPropType.isRequired,
};

export default AboutView;
