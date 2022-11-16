import './index.scss';

import {
  Tab,
  Tabs,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import {
  NavLink,
  Route,
  RouteComponentProps,
  Switch,
} from 'react-router-dom';
import slugify from 'slugify';

import AboutClasses from './components/AboutClasses';
import AboutMain from './components/AboutMain';
import AboutUsageTerms from './components/AboutUsageTerms';
import GettingStarted from './components/GettingStarted';
import Matching from './components/Matching';
import AboutNotation from './components/Notation';

interface TabOption {
  label: string;
  component: React.ComponentProps<typeof Route>['component'];
  slug: string;
  uri: string;
}

const AboutView = (props: RouteComponentProps) => {
  const { location: { pathname: currentUri } } = props;
  const [tabIndex, setTabIndex] = useState(0);

  const baseUri = '/about';
  const tabsList = [
    { label: 'About', component: AboutMain } as Partial<TabOption>,
    { label: 'Getting Started', component: GettingStarted },
    { label: 'Classes', component: AboutClasses },
    { label: 'Notation', component: AboutNotation },
    { label: 'Matching', component: Matching },
    { label: 'Terms of Use', component: AboutUsageTerms, slug: '/terms' },
  ] as TabOption[];

  const uriLookup: Record<string, number> = {};

  tabsList.forEach((tab, index) => {
    if (tab.slug === undefined) {
      tab.slug = index === 0 ? '' : `/${slugify(tab.label).toLowerCase()}`;
    }
    tab.uri = `${baseUri}${tab.slug}`;
    uriLookup[tab.uri] = index;
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

export default AboutView;
