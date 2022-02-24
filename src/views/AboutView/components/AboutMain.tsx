import {
  Chip,
  CircularProgress, Typography,
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import React from 'react';
import Chart from 'react-google-charts';
import { useQuery } from 'react-query';

import api from '@/services/api';

function AboutMain() {
  const theme = useTheme();
  const guiVersion = process.env.npm_package_version || process.env.REACT_APP_VERSION || '';

  const { data: chartData } = useQuery(
    '/stats?classList=Statement&groupBy=source',
    async ({ queryKey: [route] }) => api.get(route),
    {
      staleTime: Infinity,
      select: (response) => {
        const { Statement: result } = response;
        const data = [['source', 'count']];
        Object.entries(result).forEach(([label, value]) => {
          data.push([
            label === 'null'
              ? 'other'
              : label,
            value,
          ]);
        });
        return data;
      },
    },
  );

  const { data: versions } = useQuery(
    '/version',
    async ({ queryKey: [route] }) => api.get(route),
    { staleTime: Infinity },
  );

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
          {versions && (
            <>
              <Chip
                color="primary"
                label={`DB ${versions.db}`}
                variant="outline"
              />
              <Chip
                color="primary"
                label={`API v${versions.api}`}
                variant="outline"
              />
              <Chip
                color="primary"
                label={`Schema v${versions.schema}`}
                variant="outline"
              />
            </>
          )}
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
          colors: [theme.palette.primary.main, theme.palette.secondary.main],
          backgroundColor: 'transparent',
        }}
        width="100%"
      />
      )}
    </div>
  );
}

export default AboutMain;
