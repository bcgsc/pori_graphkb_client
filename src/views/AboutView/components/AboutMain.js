import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import {
  Typography,
} from '@material-ui/core';

import api from '../../../services/api';
import {
  PieChart,
} from '.';


class AboutMain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: [{ label: '', value: 0 }], // so that the page doesn't wait to load
      apiVersion: '',
      dbVersion: '',
      guiVersion: process.env.npm_package_version || process.env.REACT_APP_VERSION || '',
    };
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

  @boundMethod
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

  @boundMethod
  async getVersionInfo() {
    const call = api.get('/version');
    this.controllers.push(call);
    const versions = await call.request();
    this.setState({
      apiVersion: versions.api,
      dbVersion: versions.db,
    });
  }

  render() {
    const {
      stats, apiVersion, guiVersion, dbVersion,
    } = this.state;

    return (
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
  }
}

export default AboutMain;
