import {
  Checkbox,
  FormControlLabel,
  Typography,
} from '@material-ui/core';
import { formatDistanceToNow } from 'date-fns';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useContext, useEffect, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import { SecurityContext } from '@/components/SecurityContext';
import api from '@/services/api';
import { getUser } from '@/services/auth';

import TableOfContext from './TableOfContents';

const AboutUsageTerms = () => {
  const security = useContext(SecurityContext);
  const snackbar = useSnackbar();

  const [isSigned, setIsSigned] = useState(false);
  const [requiresSigning, setRequiresSigning] = useState(false);
  const [licenseContent, setlicenseContent] = useState([]);
  const [licenseEnactedAt, setLicenseEnactedAt] = useState((new Date()).getTime());


  // get the stats for the pie chart
  useEffect(() => {
    let controller;

    const getData = async () => {
      controller = api.get('/license');
      const { content, enactedAt } = await controller.request();
      setlicenseContent(content);
      setLicenseEnactedAt(enactedAt);
    };
    getData();
    return () => controller && controller.abort();
  }, [security]);

  useEffect(() => {
    let controller;

    const getData = async () => {
      const user = getUser(security);

      if (!user.signedLicenseAt || user.signedLicenseAt < licenseEnactedAt) {
        setRequiresSigning(true);
      } else {
        setIsSigned(true);
        setRequiresSigning(false);
      }
    };
    getData();
    return () => controller && controller.abort();
  }, [licenseEnactedAt, security]);


  const handleConfirmSign = useCallback(async () => {
    await api.post('/license/sign').request();
    snackbar.enqueueSnackbar('Signed the user agreement', { variant: 'success' });
    setIsSigned(false);
    setRequiresSigning(false);
  }, [snackbar]);

  return (
    <div className="about-page__content">
      <Typography variant="h2">
        GraphKB Terms of Use
      </Typography>
      <TableOfContext baseRoute="about/terms" sections={licenseContent} />
      {licenseContent.map(sectionDatum => (
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
              onChange={(_, value) => setIsSigned(value)}
            />
                    )}
          label="I have read and understood the terms of use"
        />
        <ActionButton
          disabled={!isSigned || !requiresSigning}
          onClick={handleConfirmSign}
          requireConfirm={false}
        >
          Confirm
        </ActionButton>
      </div>
      <Typography>
        page last updated {formatDistanceToNow(licenseEnactedAt)} ago
      </Typography>
    </div>
  );
};

export default AboutUsageTerms;
