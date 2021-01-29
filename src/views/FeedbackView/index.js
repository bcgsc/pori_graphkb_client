/**
 * @module /views/FeedbackView
 */
import { Typography } from '@material-ui/core';
import React from 'react';

/**
 * Feedback page
 */
function FeedbackView() {
  const emailLink = <a href={`mailto:${window._env_.CONTACT_EMAIL}`}>{window._env_.CONTACT_EMAIL}</a>;
  const jiraLink = <a href={window._env_.CONTACT_TICKET_URL} rel="noopener noreferrer" target="_blank">Tickets</a>;
  return (
    <div className="content-wrapper">
      <Typography variant="h1">Feedback</Typography>
      <Typography paragraph variant="subtitle1">Questions</Typography>
      <Typography paragraph>
        Email questions to: {emailLink}.
      </Typography>
      <Typography paragraph variant="subtitle1">Feature Requests and Bug reports</Typography>
      <Typography paragraph>
        Create tickets for feature requests, bug reports, and big
        questions that might require more discussion, under the {jiraLink} project.
      </Typography>
    </div>
  );
}

export default FeedbackView;
