import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Component for simple dialog that prompts the user before deleting a record.
 * @param {object} props
 * @param {boolean} props.isOpen - Drawer open flag
 * @param {function} props.onCancel - Handler for closing of dialog.
 * @param {function} props.onConfirm - Handler for confirming action
 * @param {string} props.message - Message to display in dialog title.
 */
function ConfirmActionDialog(props) {
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
            size="large"
          >
            Cancel
          </Button>
          <Button
            className="confirm-action-dialog__confirm"
            onClick={onConfirm}
            size="large"
          >
            Confirm
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

ConfirmActionDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
};

ConfirmActionDialog.defaultProps = {
  children: null,
};

export default ConfirmActionDialog;
