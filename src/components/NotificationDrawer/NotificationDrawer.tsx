import './NotificationDrawer.scss';

import {
  Button,
  CircularProgress,
  Drawer,
  LinearProgress,
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import React from 'react';

const NOTIFICATION_SPINNER_SIZE = 16;

interface NotificationDrawerProps {
  /** Callback for successful submission. */
  handleFinish?: (() => void) | null;
  /** Flag to tell if request is loading. */
  loading?: boolean;
  /** Flag for opening the drawer. */
  open?: boolean;
}

/**
 * Component with notification drawer for when user submits a form.
 * @param {Object} props - Component props.
 */
function NotificationDrawer(props: NotificationDrawerProps) {
  const {
    open,
    handleFinish,
    loading,
  } = props;

  return (
    <Drawer
      anchor="bottom"
      onClose={handleFinish}
      open={open}
    >
      <div className="notification-drawer">
        <div className="form-linear-progress">
          <LinearProgress
            color="secondary"
            value={loading ? 0 : 100}
            variant={loading ? 'indeterminate' : 'determinate'}
          />
        </div>
        <Button
          color="secondary"
          disabled={loading}
          onClick={handleFinish}
          size="large"
          variant="contained"
        >
          {loading
            ? (
              <CircularProgress
                color="secondary"
                size={NOTIFICATION_SPINNER_SIZE}
              />
            )
            : <CheckIcon />}
        </Button>
      </div>
    </Drawer>
  );
}

NotificationDrawer.defaultProps = {
  loading: false,
  open: false,
  handleFinish: null,
};

export default NotificationDrawer;
