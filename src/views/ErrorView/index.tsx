import './index.scss';

import { Button, Typography } from '@mui/material';
import React, { ReactNode } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { logout } from '@/components/Auth';
import {
  ApiError, ReportErrorMessage, SignedLicenseRequiredError,
} from '@/services/errors';

function ErrorDisplay({ error: errorProp }: { error: unknown; }) {
  let error: ApiError;

  if (errorProp instanceof ApiError) {
    error = errorProp;
  } else if (errorProp instanceof Error) {
    error = new ApiError(errorProp.message);
  } else if (isRouteErrorResponse(errorProp)) {
    let content = { message: errorProp.statusText };

    if (errorProp.data) {
      if (typeof errorProp.data === 'string') {
        content.message = errorProp.data;
      } else if (typeof errorProp.data === 'object') {
        content = { ...content, ...errorProp.data };
      }
    }
    error = new ApiError(content);
    error.status = errorProp.status;
  } else {
    error = new ApiError('An unknown error occurred.');
  }
  const {
    message,
    name,
    status,
  } = error;

  if (status === 401) {
    return (
      <div className="error-wrapper">
        <Typography color="error" gutterBottom variant="h2">Error Authenticating</Typography>
        <Typography paragraph>{message}</Typography>
        <Button color="primary" onClick={logout} variant="contained">
          Logout
        </Button>
      </div>
    );
  }

  if (status === 403) {
    return (
      <div className="error-wrapper">
        <Typography color="error" gutterBottom variant="h2">Forbidden</Typography>
        <Typography paragraph>{message}</Typography>
        {error instanceof SignedLicenseRequiredError && (
          <Link to="/about/terms">
            <Button color="primary" variant="contained">
              Terms of Use and License Agreement
            </Button>
          </Link>
        )}
      </div>
    );
  }

  let title = name;

  if (status === 404) {
    title = 'Not Found';
  }

  return (
    <div className="error-wrapper">
      <Typography variant="h2">
        {title}
      </Typography>
      <Typography variant="h3">
        {message}
      </Typography>
      <Typography paragraph>
        <ReportErrorMessage error={error} />
      </Typography>
      <Link to="/">
        <Button color="primary" variant="contained">
          Home
        </Button>
      </Link>
    </div>
  );
}

export const RouteErrorBoundary = () => {
  const error = useRouteError();
  return <ErrorDisplay error={error} />;
};

class ErrorBoundary extends React.Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;

    if (!error) {
      return children;
    }

    return <ErrorDisplay error={error} />;
  }
}

export default ErrorBoundary;
