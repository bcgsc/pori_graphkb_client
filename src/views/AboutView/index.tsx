import './index.scss';

import {
  Button,
  Tab,
  Tabs,
  Typography,
} from '@material-ui/core';
import React, { useEffect, useMemo, useState } from 'react';
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import slugify from 'slugify';

import { useAuth } from '@/components/Auth';

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
  const auth = useAuth();
  const navigate = useNavigate();

  const routeChange = () => {
    const path = '/about/terms';
    navigate(path);
  };

  const [tabIndex, setTabIndex] = useState(0);

  const baseUri = '/about';
  const tabsRequiringTermsAgreement = ['/about/classes', '/about/matching'];

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

  const tabsContent = () => {
    if (!auth.user?.signedLicenseAt && tabsRequiringTermsAgreement.includes(currentUri)) {
      return (
        <div className="license-agreement-message">
          <Typography color="error" gutterBottom variant="h2">Forbidden</Typography>
          <Typography paragraph>User must sign the license agreement before they can access data.</Typography>
          <Button onClick={routeChange}>Terms of Use and License Agreement</Button>
        </div>
      );
    }

    return (
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
    );
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
      {tabsContent()}
    </div>
  );
};

export default AboutView;
