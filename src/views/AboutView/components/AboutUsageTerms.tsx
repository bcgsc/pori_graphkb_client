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
  const [hasSigned, setHasSigned] = useState(false);

  const { data } = useQuery(
    ['/license', user?.signedLicenseAt],
    () => api.get('/license'),
  );

  const requiresSigning = Boolean(!data || !user || !user.signedLicenseAt || user.signedLicenseAt < data.enactedAt);
  const isSigned = !requiresSigning || hasSigned;

  const handleConfirmSign = useCallback(async () => {
    await api.post('/license/sign');
    snackbar.enqueueSnackbar('Signed the user agreement', { variant: 'success' });
    setHasSigned(true);
  }, [snackbar]);

  return (
    <div className="about-page__content">
      <Typography variant="h2">
        GraphKB Terms of Use
      </Typography>
      <TableOfContext baseRoute="about/terms" sections={data?.content ?? []} />
      {data?.content.map((sectionDatum) => (
        <div key={sectionDatum.id}>
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
              checked={isSigned || hasAcknowledgedTerms}
              disabled={!requiresSigning}
              onChange={(_, value) => setHasAcknowledgedTerms(value)}
            />
          )}
          label="I have read and understood the terms of use"
        />
        <ActionButton
          disabled={isSigned || !hasAcknowledgedTerms}
          onClick={handleConfirmSign}
          requireConfirm={false}
        >
          Confirm
        </ActionButton>
      </div>
      {data?.enactedAt && (
        <Typography>
          page last updated {formatDistanceToNow(data.enactedAt)} ago
        </Typography>
      )}
    </div>
  );
};

export default AboutUsageTerms;
