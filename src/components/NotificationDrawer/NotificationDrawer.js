import React from 'react';
import PropTypes from 'prop-types';
import {
  Drawer,
  LinearProgress,
  Button,
  CircularProgress,
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';

import './NotificationDrawer.scss';

const NOTIFICATION_SPINNER_SIZE = 16;

/**
 * Component with notification drawer for when user submits a form.
 * @param {Object} props - Component props.
 */
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
          variant="contained"
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

/**
 * @namespace
 * @property {boolean} loading - Flag to tell if request is loading.
 * @property {boolean} open - Flag for opening the drawer.
 * @property {function} handleFinish - Callback for successful submission.
 */
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
