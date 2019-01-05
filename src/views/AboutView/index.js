import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import {
  NavLink,
  Route,
  Switch,
} from 'react-router-dom';
import {
  Paper,
  Tabs,
  Tab,

} from '@material-ui/core';
import slugify from 'slugify';
import PropTypes from 'prop-types';

import './index.scss';
import {
  AboutForms,
  AboutGraphView,
  AboutMain,
  AboutNotation,
  AboutQuerying,
  AboutTableView,
} from './components';


const PAGE_ELEVATION = 4;


class AboutView extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    const baseUri = '/about';
    const { location: { pathname: currentUri } } = this.props;

    this.tabsList = [
      { label: 'About', component: AboutMain },
      { label: 'Query', component: AboutQuerying },
      { label: 'View Table', component: AboutTableView },
      { label: 'View Graph', component: AboutGraphView },
      { label: 'Input Data', component: AboutForms },
      { label: 'Notation', component: AboutNotation },
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

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
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
      <Paper elevation={PAGE_ELEVATION} className="about-page">
        <Tabs value={tabIndex} onChange={this.handleChange} scrollable>
          {tabNavList}
        </Tabs>
        <div className="tabs-content">
          <Switch>
            {tabsRouteList}
          </Switch>
        </div>
      </Paper>
    );
  }
}

export default AboutView;
