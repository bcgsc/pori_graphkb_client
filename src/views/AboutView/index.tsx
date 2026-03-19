import './index.scss';

import {
  Button,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useMemo } from 'react';
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

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
  uri: string;
}[];

const tabsList: TabsList = [
  { label: 'About', component: AboutMain, uri: '/about' },
  { label: 'Getting Started', component: GettingStarted, uri: '/about/getting-started' },
  { label: 'Classes', component: AboutClasses, uri: '/about/classes' },
  { label: 'Notation', component: AboutNotation, uri: '/about/notation' },
  { label: 'Matching', component: Matching, uri: '/about/matching' },
  { label: 'Terms of Use', component: AboutUsageTerms, uri: '/about/terms' },
];

const AboutView = () => {
  const { pathname: currentUri } = useLocation();
  const auth = useAuth();
  const navigate = useNavigate();

  const routeChange = () => {
    navigate('/about/terms');
  };

  const tabIndex = useMemo(() => tabsList.findIndex(((tab) => currentUri === tab.uri)), [currentUri]);

  const tabsRequiringTermsAgreement = ['/about/classes', '/about/matching'];

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
          {tabsList.map(({ uri, label, component }) => (
            <Route
              key={label}
              Component={component}
              path={uri.replace('/about', '')}
            />
          ))}
        </Routes>
      </div>
    );
  };

  return (
    <div className="about-page">
      <Tabs className="tabs-bar" value={tabIndex} variant="scrollable">
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
