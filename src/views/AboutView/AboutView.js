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
      <div className="about-wrapper">
        <Paper className="about-headline">
          <Typography variant="h5">About</Typography>
        </Paper>
        <PieChart
          height={500}
          width={500}
          innerRadius={100}
          data={stats}
        />
      </div>
    );
  }
}

export default AboutView;
