import './index.scss';

import {
  Tab,
  Tabs,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import {
  NavLink,
  Outlet,
  useLocation,
} from 'react-router';
import slugify from 'slugify';

type TabsList = {
  label: string;
  slug?: string;
  uri?: string;
}[];

const defaultTabsList: TabsList = [
  { label: 'About' },
  { label: 'Getting Started' },
  { label: 'Classes' },
  { label: 'Notation' },
  { label: 'Matching' },
  { label: 'Terms of Use', slug: '/terms' },
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
      <div className="tabs-content"><Outlet /></div>
    </div>
  );
};

export default AboutView;
