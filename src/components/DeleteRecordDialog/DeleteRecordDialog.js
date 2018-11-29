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
  } = props;

  return (
    <Dialog
      onClose={onClose}
      open={open}
    >
      <DialogTitle>
        {message}
      </DialogTitle>
      <DialogContent>
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
};

DeleteRecordDialog.defaultProps = {
  onClose: undefined,
  onDelete: undefined,
  message: 'Really Delete this Term?',
};

export default DeleteRecordDialog;
