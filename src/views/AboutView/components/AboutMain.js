import React, { Component } from 'react';
import {
  Typography,
} from '@material-ui/core';

import api from '../../../services/api';
import { KBContext } from '../../../components/KBContext';
import {
  PieChart,
} from '.';


class AboutMain extends Component {
  static contextType = KBContext;

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
    const { auth } = this.context;
    if (auth.isAuthorized()) {
      this.getClassStats();
      this.getVersionInfo();
    }
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  async getClassStats() {
    const call = api.get('/stats');
    this.controllers.push(call);

    const stats = await call.request();

    if (stats && stats !== null) {
      this.setState({
        stats: Array.from(
          Object.keys(stats),
          label => ({ label, value: stats[label] }),
        ),
      });
    }
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

  render() {
    const {
      stats, apiVersion, guiVersion, dbVersion,
    } = this.state;

    const countsByName = {};
    stats.forEach(({ label, value }) => {
      countsByName[label] = value;
    });

    return (
      <div className="about-page__content">
        <div className="pie-partner">
          <Typography paragraph>
            Knowlegebase is a curated database of variants in cancer and their therapeutic,
            biological, diagnostic, and prognostic implications according to literature. The
            main use of Knowlegebase is to act as the link between the known and published
            variant information and the expermientally collected data.
          </Typography>
          <Typography variant="h4">
            Current Version
          </Typography>
          <Typography paragraph>
            DB ({dbVersion}); API (v{apiVersion}); GUI (v{guiVersion})
          </Typography>

        </div>
        <PieChart
          height={500}
          width={500}
          innerRadius={50}
          data={stats}
          colorThreshold={0.05}
        />
      </div>
    );
  }
}

export default AboutMain;
