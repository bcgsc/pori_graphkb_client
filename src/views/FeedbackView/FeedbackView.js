/**
 * @module /views/FeedbackView
 */

import React from 'react';
import './FeedbackView.css';
import { Typography, Paper } from '@material-ui/core';
import config from '../../config.json';

const { FEEDBACK_EMAIL, FEEDBACK_HIPCHAT, JIRA_LINK } = config;

/**
 * Feedback page
 */
function FeedbackView() {
  const emailLink = <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>;
  const jiraLink = <a rel="noopener noreferrer" target="_blank" href={JIRA_LINK}>KBDEV</a>;
  return (
    <div className="feedback-wrapper">
      <div className="feedback-grid">
        <Paper className="feedback feedback-header" elevation={4}>
          <Typography component="h1" variant="headline">Feedback</Typography>
        </Paper>
        <Paper className="feedback feedback-body" elevation={4}>
          <Typography variant="subheading" paragraph>Questions</Typography>
          <Typography variant="body1" paragraph>
            Email questions to: {emailLink}, or send through HipChat to {FEEDBACK_HIPCHAT}.
          </Typography>
        </Paper>
        <Paper className="feedback feedback-body" elevation={4}>
          <Typography variant="subheading" paragraph>Feature Requests and Bug reports</Typography>
          <Typography variant="body1" paragraph>
            Create JIRA tickets for feature requests, bug reports, and big
            questions that might require more discussion, under the {jiraLink} project.
          </Typography>
        </Paper>
      </div>
    </div>
  );
}

export default FeedbackView;
