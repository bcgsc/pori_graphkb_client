import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';

import ConfirmActionDialog from './ConfirmActionDialog';


/**
 * @property {object} props
 * @property {bool} props.requireConfirm flag indicating we should confirm the action using a dialog
 * @property {string|*} props.children the elements contained in the button (Generally the title for the button)
 * @property {string} props.message extended message to display in the dialog when asking the user to confirm
 * @property {function} props.onClick async function to be executed on the action being confirmed (if required)
 */
class ActionButton extends React.Component {
  static propTypes = {
    requireConfirm: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    message: PropTypes.string,
    className: PropTypes.string,
  };

  static defaultProps = {
    requireConfirm: true,
    message: '',
    className: '',
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
      onClick, requireConfirm, message, children, className, ...rest
    } = this.props;
    const { dialogOpen } = this.state;

    return (
      <div className={`action-button ${className}`} {...rest}>
        <Button
          variant="contained"
          onClick={
            requireConfirm
              ? this.handleOpenDialog
              : onClick
          }
          size="large"
          color="primary"
          className="action-button__button"
        >
          {children}
        </Button>
        {requireConfirm && (
          <ConfirmActionDialog
            onCancel={this.handleDialogCancel}
            onConfirm={this.handleDialogConfirm}
            isOpen={dialogOpen}
            message={message}
            className="action-button__dialog"
          />
        )}
      </div>
    );
  }
}

export default ActionButton;
