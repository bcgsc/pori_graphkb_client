/**
 * @module /views/FeedbackView
 */
import React from 'react';
import './FeedbackView.scss';
import { Typography, Paper } from '@material-ui/core';
import config from '../../static/config';

const { FEEDBACK_EMAIL, FEEDBACK_HIPCHAT, JIRA_LINK } = config;

/**
 * Feedback page
 */
function FeedbackView() {
  const emailLink = <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>;
  const jiraLink = <a rel="noopener noreferrer" target="_blank" href={JIRA_LINK}>KBDEV</a>;
  return (
    <div className="feedback-wrapper">
      <Paper className="feedback-header" elevation={4}>
        <Typography variant="h5">Feedback</Typography>
      </Paper>
      <Paper className="feedback-body" elevation={4}>
        <Typography variant="subtitle1" paragraph>Questions</Typography>
        <Typography paragraph>
          Email questions to: {emailLink}, or send through HipChat to {FEEDBACK_HIPCHAT}.
        </Typography>
      </Paper>
      <Paper className="feedback-body" elevation={4}>
        <Typography variant="subtitle1" paragraph>Feature Requests and Bug reports</Typography>
        <Typography paragraph>
          Create JIRA tickets for feature requests, bug reports, and big
            questions that might require more discussion, under the {jiraLink} project.
        </Typography>
      </Paper>
    </div>
  );
}

export default FeedbackView;
