import {
  Chip,
  CircularProgress, Typography,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import Chart from 'react-google-charts';

import * as cssTheme from '@/_theme.scss';
import api from '@/services/api';


const AboutMain = () => {
  const [chartData, setChartData] = useState(null);
  const [apiVersion, setApiVersion] = useState('');
  const [dbVersion, setDbVersion] = useState('');
  const guiVersion = process.env.npm_package_version || process.env.REACT_APP_VERSION || '';

  // get the stats for the pie chart
  useEffect(() => {
    let controller;

    const getData = async () => {
      controller = api.get('/stats?classList=Statement&groupBy=source');
      const { Statement: result } = await controller.request();
      const data = [['source', 'count']];
      Object.entries(result).forEach(([label, value]) => {
        data.push([
          label === 'null'
            ? 'other'
            : label,
          value,
        ]);
      });
      setChartData(data);
    };
    getData();
    return () => controller && controller.abort();
  }, []);

  // get the version information
  useEffect(() => {
    let controller;

    const getData = async () => {
      controller = api.get('/version');
      const result = await controller.request();
      setApiVersion(result.api);
      setDbVersion(result.db);
    };
    getData();
    return () => controller && controller.abort();
  }, []);


  return (
    <div className="about-page__content">
      <div className="pie-partner">
        <Typography paragraph>
          Knowlegebase is a curated database of variants in cancer and their therapeutic,
          biological, diagnostic, and prognostic implications according to literature. The
          main use of Knowlegebase is to act as the link between the known and published
          variant information and the expermientally collected data.
        </Typography>
        <div className="about-page__version-chips">
          <Chip
            color="primary"
            label={`DB ${dbVersion}`}
            variant="outline"
          />
          <Chip
            color="primary"
            label={`API v${apiVersion}`}
            variant="outline"
          />
          <Chip
            color="primary"
            label={`Client v${guiVersion}`}
            variant="outline"
          />
        </div>
      </div>
      {chartData && (
      <Chart
        chartType="BarChart"
        data={chartData}
        height="500px"
        loader={<CircularProgress className="about-page__loader" />}
        options={{
          title: 'Statement Sources',
          legend: 'none',
          colors: [cssTheme.primaryMain, cssTheme.secondaryMain],
          backgroundColor: 'transparent',
        }}
        width="100%"
      />
      )}
    </div>
  );
};

export default AboutMain;
