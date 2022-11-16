import { Button } from '@material-ui/core';
import React, { ReactNode, useState } from 'react';

import ConfirmActionDialog from './ConfirmActionDialog';

type ButtonProps = React.ComponentProps<typeof Button>;

interface ActionButtonProps {
  /** the elements contained in the button (Generally the title for the button) */
  children: ReactNode;
  /** async function to be executed on the action being confirmed (if required) */
  onClick: (arg?: unknown) => void;
  className?: string;
  color?: ButtonProps['color'];
  disabled?: boolean;
  /** extended message to display in the dialog when asking the user to confirm */
  message?: string;
  /**
   * flag indicating we should confirm the action using a dialog
   * @default true
   */
  requireConfirm?: boolean;
  /** one of ['small', 'medium', 'large'] to indicate size of button */
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
}

function ActionButton(props: ActionButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  /**
   * Handler for when the user decides to cancel their action
   */
  const handleDialogCancel = () => {
    setDialogOpen(false);
  };

  /**
   * Handler for when the user confirms their action
   */

  const handleDialogConfirm = () => {
    const { onClick } = props;
    setDialogOpen(false);
    onClick();
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const {
    children,
    className,
    color,
    disabled,
    message = 'Are you sure?',
    onClick,
    requireConfirm,
    size,
    variant,
    ...rest
  } = props;

  return (
    <div className={`action-button ${className}`} {...rest}>
      <Button
        className="action-button__button"
        color={color}
        disabled={disabled}
        onClick={requireConfirm ? handleOpenDialog : onClick}
        size={size}
        variant={variant}
      >
        {children}
      </Button>
      {requireConfirm && (
        <ConfirmActionDialog
          isOpen={dialogOpen}
          message={message}
          onCancel={handleDialogCancel}
          onConfirm={handleDialogConfirm}
        />
      )}
    </div>
  );
}

ActionButton.defaultProps = {
  requireConfirm: true,
  message: 'Are you sure?',
  className: '',
  variant: 'contained',
  color: 'primary',
  disabled: false,
  size: 'large',
};

export default ActionButton;
