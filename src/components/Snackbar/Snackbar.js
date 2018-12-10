import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Snackbar } from '@material-ui/core';

const SnackbarContext = React.createContext({
  add: () => { },
  clear: () => { },
});

const withSnackbar = WrappedComponent => props => (
  <SnackbarContext.Consumer>
    {snackbar => <WrappedComponent snackbar={snackbar} {...props} />}
  </SnackbarContext.Consumer>
);

class SnackbarProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      snack: {},
    };
    this.queue = [];

    this.add = this.add.bind(this);
    this.clear = this.clear.bind(this);
    this.grabFromQueue = this.grabFromQueue.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  handleClose() {
    this.setState({ open: false });
  }

  add(message, label, action) {
    const { open } = this.state;
    const snack = { message };
    if (label && action) {
      snack.label = label;
      snack.action = () => {
        action();
        this.handleClose();
      };
    }
    this.queue.push(snack);
    if (!open) {
      this.grabFromQueue();
    }
  }

  clear() {
    this.queue = [];
    this.close();
  }

  grabFromQueue() {
    const snack = this.queue.shift();
    this.setState({ open: true, snack });
  }

  handleExit() {
    if (this.queue.length > 0) {
      this.grabFromQueue();
    }
  }

  render() {
    const { children } = this.props;
    const { open, snack } = this.state;
    const { message, label, action } = snack;
    return (
      <SnackbarContext.Provider
        value={{
          add: this.add,
          clear: this.clear,
        }}
      >
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={open}
          onClose={this.handleClose}
          autoHideDuration={4000}
          onExited={this.handleExit}
          message={<span>{message}</span>}
          action={
            (label && action) && (
              <Button key={label} color="secondary" size="small" onClick={action}>
                {label}
              </Button>)}
        />
        {children}
      </SnackbarContext.Provider>
    );
  }
}

SnackbarProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
};

SnackbarProvider.defaultProps = {
  children: null,
};

export {
  SnackbarProvider,
  withSnackbar,
};
