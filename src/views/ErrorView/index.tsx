import './index.scss';

import { Button, Typography } from '@mui/material';
import React, { ReactNode } from 'react';
import { Link } from 'react-router';

import { ReportErrorMessage } from '@/services/errors';

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

    const {
      message = 'This is the default page where errors are reported if encountered',
      name = 'No Error Reported',
    } = error;

    return (
      <div className="error-wrapper">
        <Typography variant="h2">
          {name}
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
}

export default ErrorBoundary;
