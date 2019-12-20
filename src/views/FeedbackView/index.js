/**
 * @module /views/FeedbackView
 */
import { Typography } from '@material-ui/core';
import React from 'react';

import config from '@/static/config';

const { FEEDBACK: { JIRA, EMAIL } } = config;

/**
 * Feedback page
 */
function FeedbackView() {
  const emailLink = <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;
  const jiraLink = <a href={JIRA} rel="noopener noreferrer" target="_blank">KBDEV</a>;
  return (
    <div className="content-wrapper">
      <Typography variant="h1">Feedback</Typography>
      <Typography paragraph variant="subtitle1">Questions</Typography>
      <Typography paragraph>
          Email questions to: {emailLink}.
      </Typography>
      <Typography paragraph variant="subtitle1">Feature Requests and Bug reports</Typography>
      <Typography paragraph>
          Create JIRA tickets for feature requests, bug reports, and big
            questions that might require more discussion, under the {jiraLink} project.
      </Typography>
    </div>
  );
}

export default FeedbackView;
