import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';

import ConfirmActionDialog from './ConfirmActionDialog';


/**
 * @property {object} props
 * @property {bool} props.requireConfirm flag indicating we should confirm the action using a dialog
 * @property {string|*} props.children the elements contained in the button (Generally the title for the button)
 * @property {string} props.message extended message to display in the dialog when asking the user to confirm
 * @property {function} props.onClick async function to be executed on the action being confirmed (if required)
 */
function ActionButton(props) {
  ActionButton.propTypes = {
    requireConfirm: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    message: PropTypes.string,
    className: PropTypes.string,
    variant: PropTypes.string,
    color: PropTypes.string,
    disabled: PropTypes.bool,
  };

  ActionButton.defaultProps = {
    requireConfirm: true,
    message: 'Are you sure?',
    className: '',
    variant: 'contained',
    color: 'primary',
    disabled: false,
  };

  const [dialogOpen, setDialogOpen] = useState(false);

  /**
   * Handler for when the user decides to cancel their action
   */
  const handleDialogCancel = useCallback(() => {
    setDialogOpen(false);
  });

  /**
   * Handler for when the user confirms their action
   */

  const handleDialogConfirm = useCallback(() => {
    const { onClick } = props;
    setDialogOpen(false);
    onClick();
  });

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  });

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
  } = props;

  return (
    <div className={`action-button ${className}`} {...rest}>
      <Button
        variant={variant}
        onClick={
            requireConfirm
              ? handleOpenDialog
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
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
        isOpen={dialogOpen}
        message={message}
        className="action-button__dialog"
      />
      )}
    </div>
  );
}

export default ActionButton;
