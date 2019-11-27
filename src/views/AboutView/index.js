import './index.scss';

import {
  Tab,
  Tabs,
} from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
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


class AboutView extends Component {
  static propTypes = {
    location: LocationPropType.isRequired,
  };

  constructor(props) {
    super(props);

    const baseUri = '/about';
    const { location: { pathname: currentUri } } = this.props;

    this.tabsList = [
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

    this.tabsList.forEach((tab, index) => {
      if (tab.slug === undefined) {
        const slug = index === 0 ? '' : `/${slugify(tab.label).toLowerCase()}`;
        tab.uri = `${baseUri}${slug}`;
        uriLookup[tab.uri] = index;
      }
    });

    const currentTab = uriLookup[currentUri] === undefined ? 0 : uriLookup[currentUri];

    this.state = {
      tabIndex: currentTab,
    };
  }

  @boundMethod
  handleChange(event, value) {
    this.setState({ tabIndex: value });
  }

  render() {
    const {
      tabIndex,
    } = this.state;

    const tabNavList = this.tabsList.map(({ uri, label }, index) => (
      <Tab
        key={label}
        component={NavLink}
        label={label}
        to={uri}
        value={index}
      />
    ));

    const tabsRouteList = this.tabsList.map(({ uri, label, component }) => (
      <Route
        key={label}
        component={component}
        exact
        label={label}
        path={uri}
      />
    ));

    return (
      <div className="about-page">
        <Tabs className="tabs-bar" onChange={this.handleChange} value={tabIndex} variant="scrollable">
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
}

export default AboutView;
