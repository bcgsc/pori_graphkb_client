import React, { useEffect, useState } from 'react';
import {
  Typography,
} from '@material-ui/core';

import { KBContext } from '@/components/KBContext';
import api from '@/services/api';
import {
  PieChart,
} from '.';


const AboutMain = () => {
  const [chartData, setChartData] = useState({}); // label -> value
  const [apiVersion, setApiVersion] = useState('');
  const [dbVersion, setDbVersion] = useState('');
  const guiVersion = process.env.npm_package_version || process.env.REACT_APP_VERSION || '';

  // get the stats for the pie chart
  useEffect(() => {
    let controller;

    const getData = async () => {
      controller = api.get('/stats?classList=Statement&groupBy=source');
      const { Statement: result } = await controller.request();
      setChartData(result);
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


  const data = [];
  Object.entries(chartData).forEach(([label, value]) => {
    data.push({ label, value });
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
        data={data}
        colorThreshold={0.05}
      />
    </div>
  );
};

export default AboutMain;
