import React, { Component } from 'react';
import './index.scss';
import {
  NavLink,
  Route,
  Switch,
} from 'react-router-dom';
import {
  Paper,
  Typography,
  Tabs,
  Tab,

} from '@material-ui/core';
import slugify from 'slugify';

import api from '../../services/api';

import {
  AboutForms,
  AboutGraphView,
  AboutNotation,
  AboutQuerying,
  AboutTableView,
  PieChart
} from './components';


const PAGE_ELEVATION = 4;


class AboutView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: [{ label: '', value: 0 }], // so that the page doesn't wait to load
      apiVersion: '',
      dbVersion: '',
      guiVersion: process.env.npm_package_version || process.env.REACT_APP_VERSION || '',
      tabIndex: 0,
    };

    this.getClassStats = this.getClassStats.bind(this);
    this.getVersionInfo = this.getVersionInfo.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.controllers = [];
  }

  async componentDidMount() {
    await Promise.all([
      this.getClassStats(),
      this.getVersionInfo(),
    ]);
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  async getClassStats() {
    const call = api.get('/stats');
    this.controllers.push(call);

    const stats = await call.request();

    this.setState({
      stats: Array.from(
        Object.keys(stats.result),
        label => ({ label, value: stats.result[label] }),
      ),
    });
  }

  async getVersionInfo() {
    const call = api.get('/version');
    this.controllers.push(call);
    const versions = await call.request();
    this.setState({
      apiVersion: versions.api,
      dbVersion: versions.db,
    });
  }

  handleChange(event, value) {
    this.setState({ tabIndex: value });
  }

  render() {
    const {
      stats, apiVersion, guiVersion, dbVersion, tabIndex,
    } = this.state;

    const AboutMain = () => (
      <div className="two-column-grid">
        <PieChart
          height={500}
          width={500}
          innerRadius={50}
          data={stats}
          colorThreshold={0.05}
        />
        <div className="pie-partner">
          <Typography paragraph>
                Knowlegebase is a curated database of variants in cancer and their therapeutic,
                biological, diagnostic, and prognostic implications according to literature. The
                main use of Knowlegebase is to act as the link between the known and published
                variant information and the expermientally collected data.
          </Typography>
          <Typography variant="h6" component="h4">
                Current Version
          </Typography>
          <Typography paragraph>
                DB ({dbVersion}); API (v{apiVersion}); GUI (v{guiVersion})
          </Typography>
        </div>
      </div>
    );

    const tabsList = [
      ['About', AboutMain],
      ['Query', AboutQuerying],
      ['View Table', AboutTableView],
      ['View Graph', AboutGraphView],
      ['Input Data', AboutForms],
      ['Notation', AboutNotation],
    ];

    const tabNavList = tabsList.map(([label], index) => (
      <Tab
        label={label}
        component={NavLink}
        key={label}
        value={index}
        to={
          index === 0
            ? '/about'
            : `/about/${slugify(label).toLowerCase()}`
        }
      />
    ));

    const tabsRouteList = tabsList.map(([label, component], index) => (
      <Route
        label={label}
        key={label}
        component={component}
        exact
        path={
          index === 0
            ? '/about'
            : `/about/${slugify(label).toLowerCase()}`
        }
      />
    ));

    return (
      <Paper position="static" elevation={PAGE_ELEVATION} className="about-page">
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
