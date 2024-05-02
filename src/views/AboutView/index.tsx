import './index.scss';

import {
  Tab,
  Tabs,
} from '@material-ui/core';
import React, { useEffect, useMemo, useState } from 'react';
import {
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import slugify from 'slugify';

import AboutClasses from './components/AboutClasses';
import AboutMain from './components/AboutMain';
import AboutUsageTerms from './components/AboutUsageTerms';
import GettingStarted from './components/GettingStarted';
import Matching from './components/Matching';
import AboutNotation from './components/Notation';

type TabsList = {
  label: string;
  component: (props?: { [key: string]: unknown }) => JSX.Element;
  slug?: string;
  uri?: string;
}[];

const defaultTabsList: TabsList = [
  { label: 'About', component: AboutMain },
  { label: 'Getting Started', component: GettingStarted },
  { label: 'Classes', component: AboutClasses },
  { label: 'Notation', component: AboutNotation },
  { label: 'Matching', component: Matching },
  { label: 'Terms of Use', component: AboutUsageTerms, slug: '/terms' },
];

const AboutView = () => {
  const { pathname: currentUri } = useLocation();
  const [tabIndex, setTabIndex] = useState(0);

  const baseUri = '/about';
  const uriLookup = useMemo(() => ({}), []);

  const tabsList = defaultTabsList.map((tab, index) => {
    const curr = { ...tab, uri: '' };

    if (tab.slug === undefined) {
      curr.slug = index === 0 ? '' : `/${slugify(curr.label).toLowerCase()}`;
    }
    curr.uri = `${baseUri}${curr.slug}`;
    uriLookup[curr.uri] = index;
    return curr;
  });

  useEffect(() => {
    setTabIndex(uriLookup[currentUri]);
  }, [uriLookup, currentUri]);

  const handleTabChange = (_event, value) => {
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
        <Routes>
          {tabsList.map(({ slug, label, component }) => (
            <Route
              key={label}
              Component={component}
              path={slug}
            />
          ))}
        </Routes>
      </div>
    </div>
  );
};

export default AboutView;
