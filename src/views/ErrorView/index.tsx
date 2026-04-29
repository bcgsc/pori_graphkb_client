import './index.scss';

import { Button, Typography } from '@mui/material';
import React from 'react';
import { Link, useLocation } from 'react-router';

interface EmailReportErrorProps {
  body: string;
  linkText: string;
  subject: string;
}

const EmailReportError = (props: EmailReportErrorProps) => {
  const { linkText, body, subject } = props;
  return (
    <a
      href={`mailto:${window._env_.CONTACT_EMAIL}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`}
    >
      {linkText}
    </a>
  );
};

/**
 * View for displaying uncaught error messages.
 */
const ErrorView = () => {
  const location = useLocation();
  const state = location.state ?? {};

  const {
    error: {
      message = 'This is the default page where errors are reported if encountered',
      name = 'No Error Reported',
      ...rest
    } = {},
  } = state;

  const jiraLink = <a href={window._env_.CONTACT_TICKET_URL} rel="noopener noreferrer" target="_blank">Ticket/Issue</a>;

  let errorDetails = `Error Details (Please include in error reports)
version: ${process.env.npm_package_version || process.env.REACT_APP_VERSION || ''}
error name: ${name}
error text: ${message}`;

  Object.entries(rest).forEach(([key, value]) => {
    if (value) {
      errorDetails = `${errorDetails}\n${key}: ${`${value}`.trim()}`;
    }
  });

  return (
    <div className="error-wrapper">
      <Typography variant="h2">
        {name}
      </Typography>
      <Typography variant="h3">
        {message}
      </Typography>
      <Typography paragraph>
        Report this error in a {jiraLink} ticket or email us at&nbsp;
        <EmailReportError
          body={errorDetails}
          linkText={window._env_.CONTACT_EMAIL}
          subject={`${name}: ${message}`}
        />
        .
      </Typography>
      <Link to="/">
        <Button color="primary" variant="contained">
          Home
        </Button>
      </Link>
    </div>
  );
};

export default ErrorView;
