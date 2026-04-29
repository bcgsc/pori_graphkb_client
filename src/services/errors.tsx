import { Alert } from '@mui/material';
import React from 'react';

import util from './util';

class ErrorMixin extends Error {
  content: any;

  constructor(errorContent) {
    let message;
    let content = errorContent;

    if (typeof content === 'object' && content !== null) {
      ({ message, ...content } = content);
    } else {
      message = content;
      content = {};
    }
    super(message);
    this.message = message;
    this.content = content;
    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this);
    }
  }

  toJSON() {
    return Object.assign(this.content, {
      message: this.message,
      name: this.name,
      stacktrace: this.stack ? this.stack.trim() : null,
    });
  }
}

class AbortError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'AbortError';
  }
}

class AuthenticationError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'AuthorizationError';
  }
}

class BadRequestError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'BadRequestError';
  }
}

class RecordExistsError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'RecordExistsError';
  }
}

class APIConnectionFailureError extends ErrorMixin {
  constructor(content) {
    super(content);
    this.name = 'APIConnectionFailureError';
  }
}

interface EmailReportErrorProps {
  error: Error;
}

const ReportErrorMessage = (props: EmailReportErrorProps) => {
  const { error } = props;
  const { name } = error;
  const message = util.massageRecordExistsError(error);

  const jiraLink = <a href={window._env_.CONTACT_TICKET_URL} rel="noopener noreferrer" target="_blank">Ticket/Issue</a>;

  const errorDetails = `Error Details (Please include in error reports)
version: ${process.env.npm_package_version || process.env.REACT_APP_VERSION || ''}
error name: ${name}
error text: ${message}`;

  return (
    <>
      Report this error in a {jiraLink} ticket or email us at&nbsp;
      {' '}
      <a
        href={`mailto:${window._env_.CONTACT_EMAIL}?subject=${encodeURIComponent(
          `${name}: ${message}`,
        )}&body=${encodeURIComponent(errorDetails)}`}
      >
        {window._env_.CONTACT_EMAIL}
      </a>.
    </>
  );
};

interface ErrorMessageProps {
  error: Error | null;
  children?: string;
  hideReportLink?: boolean;
}

function ErrorMessage({ error, children, hideReportLink }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <Alert severity="error">
      {children} {util.massageRecordExistsError(error)}
      {!hideReportLink && (
        <>
          {' '}
          <ReportErrorMessage error={error} />
        </>
      )}
    </Alert>
  );
}

export {
  AbortError,
  APIConnectionFailureError,
  AuthenticationError,
  AuthorizationError,
  BadRequestError,
  ErrorMessage,
  RecordExistsError,
  ReportErrorMessage,
};
