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
import React, {
  useCallback,
  useContext, useEffect, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import api from '@/services/api';

const AboutUsageTerms = () => {
  const [isSigned, setIsSigned] = useState(false);
  const [sectionData, setSectionData] = useState([]);
  const snackbar = useContext(SnackbarContext);

  // get the stats for the pie chart
  useEffect(() => {
    let controller;

    const getData = async () => {
      controller = api.get('/license');
      const { content } = await controller.request();
      setSectionData(content);
    };
    getData();
    return () => controller && controller.abort();
  }, []);

  const handleConfirmSign = useCallback(async () => {
    await api.post('/license/sign').request();
    snackbar.add('Signed the user agreement');
    setIsSigned(false);
  }, [snackbar]);

  return (
    <div className="about-page__content">
      <Typography variant="h2">
        GraphKB Terms of Use
      </Typography>
      <List>
        {sectionData.map((sectionDatum) => {
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
      {sectionData.map(sectionDatum => (
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
              onChange={(_, value) => setIsSigned(value)}
            />
                    )}
          label="I have read and understood the terms of use"
        />
        <ActionButton disabled={!isSigned} onClick={handleConfirmSign} requireConfirm={false}>
          Confirm
        </ActionButton>
      </div>
    </div>
  );
};

export default AboutUsageTerms;
