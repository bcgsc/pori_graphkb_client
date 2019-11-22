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

import {
  AboutClasses,
  AboutForms,
  AboutGraphView,
  AboutMain,
  AboutNotation,
  AboutQuerying,
  AboutStatements,
  AboutUsageTerms,
} from './components';


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
        label={label}
        component={NavLink}
        key={label}
        value={index}
        to={uri}
      />
    ));

    const tabsRouteList = this.tabsList.map(({ uri, label, component }) => (
      <Route
        label={label}
        key={label}
        component={component}
        exact
        path={uri}
      />
    ));

    return (
      <div className="about-page">
        <Tabs value={tabIndex} onChange={this.handleChange} variant="scrollable" className="tabs-bar">
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
