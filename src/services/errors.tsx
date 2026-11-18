import { Alert } from '@mui/material';
import React from 'react';

import util from './util';

type ErrorContent = string | Record<string, any>;

class ApiError extends Error {
  content: Record<string, any>;

  public status = 500;

  constructor(errorContent: ErrorContent) {
    let message: string;
    let content: Record<string, any> = {};

    if (typeof errorContent === 'object' && errorContent !== null) {
      ({ message, ...content } = errorContent);
    } else {
      message = errorContent;
      content = {};
    }
    super(message);
    this.message = message;
    this.content = content;
    Object.setPrototypeOf(this, new.target.prototype);
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

class AuthenticationError extends ApiError {
  status = 401;
}

class AuthorizationError extends ApiError {
  status = 403;
}

class BadRequestError extends ApiError {
  status = 400;
}

/**
 * Thrown by `requireSignedLicenseMiddleware` when an authenticated user has
 * not yet signed the license agreement. Handled specially by
 * `RouteErrorBoundary` to render a link to the terms of use page.
 */
class SignedLicenseRequiredError extends AuthorizationError {
  status = 403;
}

class RecordExistsError extends ApiError {
  status = 409;
}

class NotFoundError extends ApiError {
  status = 404;
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
  ApiError,
  AuthenticationError,
  AuthorizationError,
  BadRequestError,
  ErrorMessage,
  NotFoundError,
  RecordExistsError,
  ReportErrorMessage,
  SignedLicenseRequiredError,
};
