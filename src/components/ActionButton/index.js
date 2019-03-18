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
    variant: PropTypes.string,
    color: PropTypes.string,
    disabled: PropTypes.bool,
  };

  static defaultProps = {
    requireConfirm: true,
    message: 'Are you sure?',
    className: '',
    variant: 'contained',
    color: 'primary',
    disabled: false,
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
  handleDialogConfirm() {
    const { onClick } = this.props;
    this.setState({ dialogOpen: false });
    onClick();
  }

  @boundMethod
  handleOpenDialog() {
    this.setState({ dialogOpen: true });
  }

  render() {
    const {
      children,
      className,
      color,
      disabled,
      message,
      onClick,
      requireConfirm,
      variant,
      ...rest
    } = this.props;
    const { dialogOpen } = this.state;

    return (
      <div className={`action-button ${className}`} {...rest}>
        <Button
          variant={variant}
          onClick={
            requireConfirm
              ? this.handleOpenDialog
              : onClick
          }
          size="large"
          color={color}
          className="action-button__button"
          disabled={disabled}
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
