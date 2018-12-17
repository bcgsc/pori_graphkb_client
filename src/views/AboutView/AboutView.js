import React, { Component } from 'react';
import './AboutView.css';
import {
  Paper,
  Typography,
} from '@material-ui/core';
import PieChart from '../../components/PieChart';

import api from '../../services/api';


class AboutView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: [],
    };

    this.getClassStats = this.getClassStats.bind(this);
  }

  async componentDidMount() {
    await this.getClassStats();
  }

  async getClassStats() {
    const stats = await api.get('/stats');

    this.setState({
      stats: Array.from(
        Object.keys(stats.result),
        label => ({ label, value: stats.result[label] }),
      ),
    });
  }

  render() {
    const { stats } = this.state;

    if (stats.length === 0) return null;

    return (
      <div className="view-wrapper">
        <Paper className="view-header" elevation={4}>
          <Typography variant="h5">About GraphKB</Typography>
        </Paper>
        <Paper className="about-page">
          <PieChart
            height={500}
            width={500}
            innerRadius={100}
            data={stats}
          />
          <Typography paragraph className="readable">
            Knowlegebase is a curated database of variants in cancer and their therapeutic,
            biological, diagnostic, and prognostic implications according to literature. The main
            use of Knowlegebase is to act as the link between the known and published variant
            information and the expermientally collected data.
          </Typography>
        </Paper>
      </div>
    );
  }
}

export default AboutView;
