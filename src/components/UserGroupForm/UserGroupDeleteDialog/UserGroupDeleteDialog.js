import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@material-ui/core';

function UserGroupDeleteDialog(props) {
  const {
    open,
    onClose,
    onSubmit,
    deletedUserGroup,
  } = props;

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
      classes={{
        paper: 'delete-dialog',
      }}
    >
      <DialogTitle>
        Delete User Group &quot;{(deletedUserGroup || '').name}&quot;?
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          This action cannot be undone
        </DialogContentText>
      </DialogContent>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button onClick={onClose}>
          No
        </Button>
        <Button id="delete-btn" onClick={() => onSubmit(deletedUserGroup)}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UserGroupDeleteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  deletedUserGroup: PropTypes.object,
};

UserGroupDeleteDialog.defaultProps = {
  deletedUserGroup: null,
};

export default UserGroupDeleteDialog;
