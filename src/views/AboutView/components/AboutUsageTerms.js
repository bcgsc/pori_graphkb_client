import {
  Checkbox,
  FormControlLabel,
  Typography,
} from '@material-ui/core';
import { formatDistanceToNow } from 'date-fns';
import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';
import { useQuery } from 'react-query';

import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/components/Auth';
import api from '@/services/api';

import TableOfContext from './TableOfContents';

const AboutUsageTerms = () => {
  const { user } = useAuth();
  const snackbar = useSnackbar();
  const [hasAcknowledgedTerms, setHasAcknowledgedTerms] = useState(false);

  const { data, refetch } = useQuery(
    ['/license', user.signedLicenseAt],
    () => api.get('/license').request(),
  );

  const requiresSigning = Boolean(!data || !user || !user.signedLicenseAt || user.signedLicenseAt < data.licenseEnactedAt);
  const isSigned = !requiresSigning;


  const handleConfirmSign = useCallback(async () => {
    await api.post('/license/sign').request();
    snackbar.enqueueSnackbar('Signed the user agreement', { variant: 'success' });
    refetch();
  }, [refetch, snackbar]);

  return (
    <div className="about-page__content">
      <Typography variant="h2">
        GraphKB Terms of Use
      </Typography>
      <TableOfContext baseRoute="about/terms" sections={data?.licenseContent} />
      {data?.licenseContent.map(sectionDatum => (
        <div>
          <Typography id={sectionDatum.id} variant="h3">
            {sectionDatum.label}
          </Typography>
          <Typography paragraph>
            {sectionDatum.content}
          </Typography>
        </div>
      ))}
      <div className="about-page__sign-off">
        <FormControlLabel
          control={(
            <Checkbox
              checked={isSigned}
              disabled={!requiresSigning}
              onChange={(_, value) => setHasAcknowledgedTerms(value)}
            />
                    )}
          label="I have read and understood the terms of use"
        />
        <ActionButton
          disabled={!isSigned || !hasAcknowledgedTerms}
          onClick={handleConfirmSign}
          requireConfirm={false}
        >
          Confirm
        </ActionButton>
      </div>
      <Typography>
        page last updated {formatDistanceToNow(data?.licenseEnactedAt)} ago
      </Typography>
    </div>
  );
};

export default AboutUsageTerms;
