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
const ConfirmActionDialog = (props) => {
  const {
    children,
    isOpen,
    message,
    onCancel,
    onConfirm,
  } = props;

  return (
    <Dialog
      onClose={onCancel}
      open={isOpen}
      className="confirm-action-dialog"
    >
      <DialogTitle>
        {message}
      </DialogTitle>
      <DialogContent>
        {children}
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button
            onClick={onCancel}
            color="primary"
            size="large"
            className="confirm-action-dialog__cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            size="large"
            className="confirm-action-dialog__confirm"
          >
            Confirm
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

ConfirmActionDialog.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
  isOpen: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

ConfirmActionDialog.defaultProps = {
  children: null,
};

export default ConfirmActionDialog;
