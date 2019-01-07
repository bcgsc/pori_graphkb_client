import React from 'react';
import PropTypes from 'prop-types';
import {
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import DeleteRecordDialog from '../../../../components/DeleteRecordDialog/DeleteRecordDialog';

/**
 * Handles user delete dialog.
 */
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
    <DeleteRecordDialog
      open={open && selected.length !== 0}
      onClose={onClose}
      onDelete={onSubmit}
      TransitionProps={{ unmountOnExit: true }}
      message="Delete Users?"
    >
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
    </DeleteRecordDialog>
  );
}

/**
 * @namespace
 * @property {boolean} open - dialog open state.
 * @property {function} onClose - dialog close event handler.
 * @property {function} onSubmit - deletion confirmation event handler.
 * @property {function} onCancel - Unstage user from deletion event handler.
 * @property {Array.<string>} selected - list of user record ids that are
 * staged for deletion.
 * @property {Array} users - list of all user records.
 */
UserDeleteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  selected: PropTypes.arrayOf(PropTypes.string),
  users: PropTypes.array,
};

UserDeleteDialog.defaultProps = {
  selected: [],
  users: [],
};

export default UserDeleteDialog;
