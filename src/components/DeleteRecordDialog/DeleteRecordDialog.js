import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@material-ui/core';

/**
 * Component for simple dialog that prompts the user before deleting a record.
 */
function DeleteRecordDialog(props) {
  const {
    open,
    onClose,
    onDelete,
    message,
    children,
  } = props;

  return (
    <Dialog
      onClose={onClose}
      open={open}
      className="delete-dialog"
    >
      <DialogTitle>
        {message}
      </DialogTitle>
      <DialogContent>
        {children}
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button
            onClick={onClose}
            color="primary"
            size="large"
            id="cancel-delete"
          >
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            size="large"
            id="confirm-delete"
          >
            Delete
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

/**
 * @namespace
 * @property {boolean} open - Drawer open flag
 * @property {function} onClose - Handler for closing of dialog.
 * @property {function} onDelete - Handler for confirming delete of record.
 * @property {string} message - Message to display in dialog title.
 */
DeleteRecordDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onDelete: PropTypes.func,
  message: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
};

DeleteRecordDialog.defaultProps = {
  onClose: undefined,
  onDelete: undefined,
  message: 'Really Delete this Term?',
  children: null,
};

export default DeleteRecordDialog;
