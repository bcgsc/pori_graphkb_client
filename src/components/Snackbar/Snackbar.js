import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Snackbar } from '@material-ui/core';

/**
 * High level snackbar state manager for app.
 */
const SnackbarContext = React.createContext({
  add: () => { },
  clear: () => { },
});

const withSnackbar = WrappedComponent => props => (
  <SnackbarContext.Consumer>
    {snackbar => <WrappedComponent snackbar={snackbar} {...props} />}
  </SnackbarContext.Consumer>
);

/**
 * Renders snackbar when activated.
 *
 * @property {object} props
 * @property {any} props.children - Rest of app.
 */
class SnackbarProvider extends Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
  };

  static defaultProps = {
    children: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      snack: {},
    };
    this.queue = [];
  }

  /**
   * Closes snackbar.
   */
  @boundMethod
  handleClose() {
    this.setState({ open: false });
  }

  /**
   * Pushes a new snack to the snack queue. Opens snackbar if currently closed.
   * @param {string} message - Snackbar message.
   * @param {string} label - Snackbar button label.
   * @param {function} action - Action on snackbar button click.
   */
  @boundMethod
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

  /**
   * Clears snack queue and closes current snackbar.
   */
  @boundMethod
  clear() {
    this.queue = [];
    this.handleClose();
  }

  /**
   * Takes the first snack in the queue and displays it.
   */
  @boundMethod
  grabFromQueue() {
    const snack = this.queue.shift();
    this.setState({ open: true, snack });
  }

  /**
   * Displays the next item in the queue when the current snack closes.
   */
  @boundMethod
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
              </Button>
            )}
        />
        {children}
      </SnackbarContext.Provider>
    );
  }
}

export {
  SnackbarProvider,
  withSnackbar,
  SnackbarContext,
};
