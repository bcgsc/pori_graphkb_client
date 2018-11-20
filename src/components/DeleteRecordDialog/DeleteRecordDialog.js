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
    handleDialog,
    onDelete,
    message,
  } = props;

  return (
    <Dialog
      onClose={() => handleDialog(false)}
      open={open}
    >
      <DialogTitle>
        {message}
      </DialogTitle>
      <DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button
            onClick={() => handleDialog(false)}
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

DeleteRecordDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleDialog: PropTypes.func,
  onDelete: PropTypes.func,
  message: PropTypes.string,
};

DeleteRecordDialog.defaultProps = {
  handleDialog: undefined,
  onDelete: undefined,
  message: 'Really Delete this Term?',
};

export default DeleteRecordDialog;
