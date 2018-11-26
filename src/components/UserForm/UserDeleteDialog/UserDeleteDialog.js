import React from 'react';
import PropTypes from 'prop-types';
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';

function UserDeleteDialog(props) {
  const {
    open,
    onClose,
    selected,
    onSubmit,
    users,
    onCancel,
  } = props;

  return (
    <Dialog
      open={open && selected.length !== 0}
      onClose={onClose}
      classes={{
        paper: 'delete-dialog',
      }}
      TransitionProps={{ unmountOnExit: true }}
    >
      <DialogTitle>
        Delete Users?
      </DialogTitle>
      <DialogContent>
        <List>
          {selected.map((rid) => {
            const user = users.find(u => u['@rid'] === rid);
            return (
              <ListItem key={rid}>
                <ListItemAvatar>
                  <Avatar classes={{ colorDefault: 'avatar-colored' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemSecondaryAction>
                  <IconButton onClick={() => onCancel(rid)}>
                    <CancelIcon />
                  </IconButton>
                </ListItemSecondaryAction>
                <ListItemText primary={user.name} />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UserDeleteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  selected: PropTypes.array,
  users: PropTypes.array,
};

UserDeleteDialog.defaultProps = {
  selected: [],
  users: [],
};

export default UserDeleteDialog;
