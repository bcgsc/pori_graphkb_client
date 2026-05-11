import {
  Chip,
  CircularProgress, Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import Chart from 'react-google-charts';
import { useQuery } from 'react-query';

import { useAuth } from '@/components/Auth';
import api from '@/services/api';

const AboutMain = () => {
  const theme = useTheme();
  const auth = useAuth();
  const hasSignedLicense = !!auth.user?.signedLicenseAt;

  const guiVersion = process.env.REACT_APP_VERSION || process.env.npm_package_version || '';
  const { data: chartData } = useQuery({
    queryKey: ['/stats?classList=Statement&groupBy=source'],
    queryFn: async ({ queryKey: [route] }) => api.get(route),
    staleTime: Infinity,
    enabled: hasSignedLicense,
    select: (response) => {
      const { Statement: result } = response;
      const data = [['source', 'count']];
      Object.entries(result as Record<string, string>).forEach(([label, value]) => {
        data.push([
          label === 'null'
            ? 'other'
            : label,
          value,
        ]);
      });
      return data;
    },
  });

  const { data: versions } = useQuery({
    queryKey: ['/version'],
    queryFn: async ({ queryKey: [route] }) => api.get(route),
    staleTime: Infinity,
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
        <div className="about-page__version-chips">
          {versions && (
            <>
              <Chip
                color="primary"
                label={`DB ${versions.db}`}
                variant="outlined"
              />
              <Chip
                color="primary"
                label={`API v${versions.api}`}
                variant="outlined"
              />
              <Chip
                color="primary"
                label={`Schema v${versions.schema}`}
                variant="outlined"
              />
            </>
          )}
          <Chip
            color="primary"
            label={`Client v${guiVersion}`}
            variant="outlined"
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
};

export default AboutMain;
