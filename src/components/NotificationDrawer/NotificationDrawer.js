import React from 'react';
import PropTypes from 'prop-types';
import './NotificationDrawer.css';
import {
  Drawer,
  LinearProgress,
  Button,
  CircularProgress,
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';

const NOTIFICATION_SPINNER_SIZE = 16;

function NotificationDrawer(props) {
  const {
    open,
    handleFinish,
    loading,
  } = props;

  return (
    <Drawer
      open={open}
      onClose={handleFinish}
      anchor="bottom"
    >
      <div className="notification-drawer">
        <div className="form-linear-progress">
          <LinearProgress
            color="secondary"
            variant={loading ? 'indeterminate' : 'determinate'}
            value={loading ? 0 : 100}
          />
        </div>
        <Button
          color="secondary"
          onClick={handleFinish}
          disabled={loading}
          variant="raised"
          size="large"
        >
          {loading
            ? (
              <CircularProgress
                size={NOTIFICATION_SPINNER_SIZE}
                color="secondary"
              />
            )
            : <CheckIcon />
          }
        </Button>
      </div>
    </Drawer>
  );
}

NotificationDrawer.propTypes = {
  loading: PropTypes.bool,
  open: PropTypes.bool,
  handleFinish: PropTypes.func,
};

NotificationDrawer.defaultProps = {
  loading: false,
  open: false,
  handleFinish: null,
};

export default NotificationDrawer;
