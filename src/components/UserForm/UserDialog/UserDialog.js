import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  TextField,
  FormGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText,
  Avatar,
  Chip,
} from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import auth from '../../../services/auth';

function UserDialog(props) {
  const {
    users,
    selectedUser,
    open,
    onClose,
    error,
    userGroups,
    editUser,
    addUser,
    date,
    newUserName,
    newUserGroups,
    onChange,
    onUserGroup,
    ...other
  } = props;


  const isTaken = users.map(u => u.name.toLowerCase()).includes(newUserName.toLowerCase());
  const isSelected = selectedUser
    ? selectedUser.name.toLowerCase() === newUserName.toLowerCase()
    : false;

  const groups = [
    ...userGroups,
    ...(((selectedUser && selectedUser.groups) || [])
      .filter(g => !userGroups.find(uG => uG['@rid'] === g['@rid']))),
  ];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      classes={{
        paper: 'new-user-dialog',
      }}
      TransitionProps={{ unmountOnExit: true }}
      {...other}
    >
      <DialogTitle>
        {selectedUser ? 'Edit User' : 'New User'}
      </DialogTitle>
      <DialogContent classes={{ root: 'new-user-dialog-content' }}>
        <div className="new-user-form">
          <FormControl
            error={(isTaken && !isSelected) || error}
          >
            <TextField
              onChange={onChange}
              value={newUserName}
              name="newUserName"
              label="Name"
              error={(isTaken && !isSelected) || error}
            />
            {((isTaken && !isSelected) || error)
              && <FormHelperText>User name already exists</FormHelperText>
            }
          </FormControl>
          <FormControl component="fieldset">
            <FormLabel component="legend">Groups</FormLabel>
            <FormGroup className="new-user-group-checkboxes">
              {groups.map(userGroup => (
                <div key={userGroup['@rid']}>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={!!newUserGroups.find(uG => uG['@rid'] === userGroup['@rid'])}
                        onChange={() => onUserGroup(userGroup)}
                      />)}
                    label={userGroup.name}
                  />
                  {!userGroups.find(uG => uG['@rid'] === userGroup['@rid'])
                    && <Typography variant="caption" color="primary">Deprecated Group</Typography>}
                </div>))}
            </FormGroup>
          </FormControl>
        </div>
        <Paper className="new-user-preview">
          <div className="preview-name">
            <Avatar classes={{ colorDefault: newUserName ? 'avatar-colored' : '' }}>
              {newUserName.charAt(0).toUpperCase() || <PersonIcon />}
            </Avatar>
            <Typography component="h3" variant="subtitle1">
              {newUserName || <Typography color="textSecondary">[New User]</Typography>}
            </Typography>
          </div>
          <table>
            <tbody>
              <tr>
                <td>
                  <Typography variant="body1" component="h4">
                    Created By:
                  </Typography>
                </td>
                <td>
                  <Typography variant="caption" component="p">
                    {selectedUser
                      ? (selectedUser.createdBy || { name: 'none' }).name
                      : auth.getUser() && auth.getUser().name}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="body1" component="h4">
                    Created At:
                  </Typography>
                </td>
                <td>
                  <Typography variant="caption" component="p">
                    {selectedUser ? new Date(selectedUser.createdAt).toLocaleString()
                      : date}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td>
                  <Typography variant="body1" component="h4">
                    Groups:
                  </Typography>
                </td>
                <td />
              </tr>
              <tr>
                <td style={{ whiteSpace: 'normal' }} colSpan={2}>
                  {newUserGroups.length !== 0 ? newUserGroups.map(group => (
                    <Chip
                      key={group['@rid']}
                      label={group.name}
                      className="group-chip"
                      color={
                        !userGroups.find(uG => uG['@rid'] === group['@rid'])
                          ? 'default'
                          : 'primary'
                      }
                    />)) : <Typography component="p" variant="caption">No groups</Typography>}
                </td>
              </tr>
            </tbody>
          </table>
        </Paper>
      </DialogContent>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => selectedUser
            ? editUser(newUserName, newUserGroups)
            : addUser(newUserName, newUserGroups)}
          disabled={(isTaken && !isSelected) || error}
          id="user-dialog-submit-btn"
        >
          {selectedUser ? 'Confirm Changes' : 'Add User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  date: PropTypes.string,
  users: PropTypes.array,
  userGroups: PropTypes.array,
  selectedUser: PropTypes.object,
  error: PropTypes.bool,
  newUserName: PropTypes.string,
  newUserGroups: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  addUser: PropTypes.func.isRequired,
  editUser: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onUserGroup: PropTypes.func.isRequired,
};

UserDialog.defaultProps = {
  date: '',
  users: [],
  userGroups: [],
  selectedUser: null,
  error: false,
  newUserName: '',
  newUserGroups: [],
};

export default UserDialog;
