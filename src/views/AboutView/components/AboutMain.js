import React, { useEffect, useState } from 'react';
import {
  Typography, CircularProgress, Chip,
} from '@material-ui/core';
import Chart from 'react-google-charts';

import { KBContext } from '@/components/KBContext';
import api from '@/services/api';

import * as cssTheme from '@/_theme.scss';


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
        data.push([label, value]);
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
            label={`DB ${dbVersion}`}
            color="primary"
            variant="outline"
          />
          <Chip
            label={`API v${apiVersion}`}
            color="primary"
            variant="outline"
          />
          <Chip
            label={`Client v${guiVersion}`}
            color="primary"
            variant="outline"
          />
        </div>
      </div>
      {chartData && (
      <Chart
        chartType="BarChart"
        width="100%"
        height="500px"
        data={chartData}
        options={{
          title: 'Statement Sources',
          legend: 'none',
          colors: [cssTheme.primaryMain, cssTheme.secondaryMain],
        }}
        loader={<CircularProgress className="about-page__loader" />}
      />
      )}
    </div>
  );
};

export default AboutMain;
