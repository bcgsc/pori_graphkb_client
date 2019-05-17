/**
 * @module /views/FeedbackView
 */
import React from 'react';
import { Typography } from '@material-ui/core';

import config from '../../static/config';

const { FEEDBACK: { JIRA, EMAIL } } = config;

/**
 * Feedback page
 */
function FeedbackView() {
  const emailLink = <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;
  const jiraLink = <a rel="noopener noreferrer" target="_blank" href={JIRA}>KBDEV</a>;
  return (
    <div className="content-wrapper">
      <Typography component="h1">Feedback</Typography>
      <Typography variant="subtitle1" paragraph>Questions</Typography>
      <Typography paragraph>
          Email questions to: {emailLink}.
      </Typography>
      <Typography variant="subtitle1" paragraph>Feature Requests and Bug reports</Typography>
      <Typography paragraph>
          Create JIRA tickets for feature requests, bug reports, and big
            questions that might require more discussion, under the {jiraLink} project.
      </Typography>
    </div>
  );
}

export default FeedbackView;
