import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import React, { ReactNode } from 'react';

interface ConfirmActionDialogProps {
  /** Drawer open flag */
  isOpen: boolean;
  /** Message to display in dialog title. */
  message: string;
  /** Handler for closing of dialog. */
  onCancel: React.ComponentProps<typeof Button>['onClick'];
  /** Handler for confirming action */
  onConfirm: React.ComponentProps<typeof Button>['onClick'];
  children?: ReactNode;
}

/**
 * Component for simple dialog that prompts the user before deleting a record.
 */
const ConfirmActionDialog = (props: ConfirmActionDialogProps) => {
  const {
    children,
    isOpen,
    message,
    onCancel,
    onConfirm,
  } = props;

  return (
    <Dialog
      className="confirm-action-dialog"
      onClose={onCancel}
      open={isOpen}
    >
      <DialogTitle>
        {message}
      </DialogTitle>
      <DialogContent>
        {children}
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button
            className="confirm-action-dialog__cancel"
            color="primary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="confirm-action-dialog__confirm"
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmActionDialog;
