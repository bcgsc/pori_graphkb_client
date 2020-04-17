import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import {
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core';
import { formatDistanceToNow } from 'date-fns';
import React, {
  useCallback,
  useContext, useEffect, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import { SecurityContext } from '@/components/SecurityContext';
import api from '@/services/api';
import { getUser } from '@/services/auth';

const AboutUsageTerms = () => {
  const security = useContext(SecurityContext);
  const snackbar = useContext(SnackbarContext);

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
    snackbar.add('Signed the user agreement');
    setIsSigned(false);
    setRequiresSigning(false);
  }, [snackbar]);

  return (
    <div className="about-page__content">
      <Typography variant="h2">
        GraphKB Terms of Use
      </Typography>
      <List>
        {licenseContent.map((sectionDatum) => {
          const anchorId = sectionDatum.id;
          return (
            <ListItem>
              <ListItemIcon className="letter-icon">
                {sectionDatum.label.slice(0, 1)}
              </ListItemIcon>
              <ListItemText>
                <a href={`about/terms#${anchorId}`}> {sectionDatum.label}</a>
              </ListItemText>
            </ListItem>
          );
        })}
      </List>
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
