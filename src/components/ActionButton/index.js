import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';

import ConfirmActionDialog from './ConfirmActionDialog';


class ActionButton extends React.Component {
  static propTypes = {
    requireConfirm: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    children: PropTypes.object.isRequired,
    message: PropTypes.string,
  };

  static defaultProps = {
    requireConfirm: true,
    message: '',
  };

  constructor(props) {
    super(props);
    this.state = { dialogOpen: false };
  }


  /**
   * Handler for when the user decides to cancel their action
   */
  @boundMethod
  handleDialogCancel() {
    this.setState({ dialogOpen: false });
  }

  /**
   * Handler for when the user confirms their action
   */
  @boundMethod
  async handleDialogConfirm() {
    const { onClick } = this.props;
    this.setState({ dialogOpen: false });
    await onClick();
  }

  @boundMethod
  handleOpenDialog() {
    this.setState({ dialogOpen: true });
  }

  render() {
    const {
      onClick, requireConfirm, message, children,
    } = this.props;
    const { dialogOpen } = this.state;

    return (
      <div>
        <Button
          variant="contained"
          onClick={
          requireConfirm
            ? this.handleOpenDialog
            : onClick
        }
          size="large"
          color="primary"
        >
          {children}
        </Button>
        {requireConfirm && (
          <ConfirmActionDialog
            onCancel={this.handleDialogCancel}
            onConfirm={this.handleDialogConfirm}
            isOpen={dialogOpen}
            message={message}
          />
        )}
      </div>
    );
  }
}

export default ActionButton;
