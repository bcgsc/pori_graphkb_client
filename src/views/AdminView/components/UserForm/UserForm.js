import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './UserForm.scss';
import {
  Paper,
  Typography,
  IconButton,
  Badge,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import UserDialog from './UserDialog';
import UserDeleteDialog from './UserDeleteDialog';

/**
 * Component for managing AdminView User form state.
 */
class UserForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [],
      date: '',
      newUserName: '',
      newUserGroups: [],
      selectedUser: null,
      userDialogOpen: false,
      deleteDialogOpen: false,
      error: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleCheckAllUsers = this.handleCheckAllUsers.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleDeleteDialog = this.handleDeleteDialog.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleNewUserGroup = this.handleNewUserGroup.bind(this);
    this.handleUserAdd = this.handleUserAdd.bind(this);
    this.handleUsersDelete = this.handleUsersDelete.bind(this);
    this.handleUserDialog = this.handleUserDialog.bind(this);
    this.handleUserEdit = this.handleUserEdit.bind(this);
    this.handleExited = this.handleExited.bind(this);
  }

  /**
   * Clears all asynchronous operations.
   */
  componentWillUnmount() {
    const { timerId } = this.state;
    window.clearInterval(timerId);
  }

  /**
   * Updates state variables with a given input event.
   * @param {Event} event - user input event.
   */
  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  /**
   * Selects all users, or clears selected users.
   */
  handleCheckAllUsers() {
    const { users } = this.props;
    const { selected } = this.state;
    let newSelected;
    if (selected.length === users.length) {
      newSelected = [];
    } else {
      newSelected = users.map(u => u['@rid']);
    }
    this.setState({ selected: newSelected });
  }

  /**
   * Selects a single user from the table.
   * @param {string} rid - user record identifier.
   */
  handleCheckbox(rid) {
    const { selected } = this.state;
    const i = selected.indexOf(rid);
    if (i === -1) {
      selected.push(rid);
    } else {
      selected.splice(i, 1);
    }
    const update = { selected };
    if (selected.length === 0) {
      update.deleteDialogOpen = false;
    }
    this.setState(update);
  }

  /**
   * Toggles user delete dialog.
   */
  handleDeleteDialog() {
    const { deleteDialogOpen } = this.state;
    this.setState({ deleteDialogOpen: !deleteDialogOpen });
  }

  /**
   * Calls deleteUsers prop function.
   */
  handleUsersDelete() {
    const { deleteUsers } = this.props;
    const { selected } = this.state;
    deleteUsers(selected);
    this.setState({ selected: [], deleteDialogOpen: false });
  }

  /**
   * Toggles new user dialog and resets/stops the createdAt timer.
   */
  handleUserDialog() {
    const { userDialogOpen, timerId } = this.state;
    let update = {};
    if (timerId) {
      window.clearInterval(timerId);
      update = { timerId: null };
    } else {
      update = {
        date: new Date(),
        timerId: window.setInterval(
          () => {
            this.setState({ date: new Date() });
          }, 1000,
        ),
      };
    }
    update.userDialogOpen = !userDialogOpen;
    this.setState(update);
  }

  /**
   * Copies over user object to temporary model that can be edited, and
   * opens the user editing dialog.
   * @param {Object} user - user object to be edited.
   */
  handleEdit(user) {
    this.setState({
      newUserGroups: user.groups.slice(),
      newUserName: user.name,
      selectedUser: user,
      userDialogOpen: true,
    });
  }

  /**
   * Clears temp user data after dialog has exited so as to not flicker the
   * contents.
   */
  handleExited() {
    this.setState({ newUserName: '', newUserGroups: [] });
  }

  /**
   * Toggles a usergroup in the new user form.
   * @param {string} group - usergroup record identifier to be added/removed
   * from new user list.
   */
  handleNewUserGroup(group) {
    const { newUserGroups } = this.state;
    const i = newUserGroups.findIndex(g => g['@rid'] === group['@rid']);
    if (i === -1) {
      newUserGroups.push(group);
    } else {
      newUserGroups.splice(i, 1);
    }
    this.setState({ newUserGroups });
  }

  /**
   * Sends a PATCH request to the server, re-initializes new user form model,
   * and updates user list.
   */
  async handleUserEdit() {
    const { users, editUser } = this.props;
    const {
      selectedUser,
      newUserName,
      newUserGroups,
    } = this.state;

    const isTaken = users.map(u => u.name.toLowerCase())
      .includes(newUserName.toLowerCase());

    const isSelected = selectedUser.name.toLowerCase()
      !== newUserName.toLowerCase();
    if ((isTaken && isSelected) || !newUserName) {
      this.setState({ error: true });
      return;
    }
    const payload = { name: newUserName, groups: newUserGroups };
    await editUser(selectedUser['@rid'].slice(1), payload);
    this.setState({
      newUserName: '',
      newUserGroups: [],
    }, this.handleUserDialog);
  }

  /**
   * Validates form and submits payload to addUser prop function.
   */
  async handleUserAdd() {
    const { users, addUser } = this.props;
    const { newUserName, newUserGroups } = this.state;
    if (users.map(u => u.name.toLowerCase())
      .includes(newUserName.toLowerCase()) || !newUserName
    ) {
      this.setState({ error: true });
      return;
    }
    const payload = { name: newUserName, groups: newUserGroups };
    await addUser(payload);
    this.setState({
      newUserName: '',
      newUserGroups: [],
    }, this.handleUserDialog);
  }


  render() {
    const {
      users,
      userGroups,
    } = this.props;

    const {
      selected,
      deleteDialogOpen,
      date,
      selectedUser,
      newUserGroups,
      newUserName,
      userDialogOpen,
      error,
    } = this.state;

    return (
      <Paper className="admin-users">
        <UserDeleteDialog
          open={deleteDialogOpen}
          onClose={this.handleDeleteDialog}
          onSubmit={this.handleUsersDelete}
          users={users}
          onCancel={this.handleCheckbox}
          selected={selected}
        />
        <UserDialog
          open={userDialogOpen}
          date={date.toLocaleString()}
          users={users}
          userGroups={userGroups}
          selectedUser={selectedUser}
          error={error}
          newUserName={newUserName}
          newUserGroups={newUserGroups}
          onClose={this.handleUserDialog}
          addUser={this.handleUserAdd}
          editUser={this.handleUserEdit}
          onChange={this.handleChange}
          onUserGroup={this.handleNewUserGroup}
          onExited={this.handleExited}
        />
        <div className="admin-section-heading">
          <Typography component="h2" variant="h6">Users</Typography>
          <div className="admin-section-heading-btns">
            <IconButton
              disabled={selected.length === 0}
              onClick={this.handleDeleteDialog}
            >
              {selected.length === 0 ? <DeleteIcon />
                : (
                  <Badge
                    classes={{
                      badge: 'admin-badge',
                    }}
                    color="secondary"
                    badgeContent={selected.length}
                  >
                    <DeleteIcon />
                  </Badge>
                )}
            </IconButton>
            <IconButton onClick={this.handleUserDialog}>
              <AddIcon />
            </IconButton>
          </div>
        </div>
        <div className="admin-table-wrapper">
          <Table className="admin-table">
            <TableHead>
              <TableRow id="admin-sticky-row">
                <TableCell padding="checkbox">
                  <Checkbox
                    onChange={this.handleCheckAllUsers}
                    checked={selected.length === users.length}
                  />
                </TableCell>
                <TableCell padding="dense">RID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell padding="dense">Created At</TableCell>
                <TableCell>Groups</TableCell>
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user['@rid']}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      onChange={() => this.handleCheckbox(user['@rid'])}
                      checked={selected.includes(user['@rid'])}
                    />
                  </TableCell>
                  <TableCell padding="dense">{user['@rid']}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell padding="dense">
                    {new Date(user.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{user.groups.map(g => g.name).join(', ')}</TableCell>
                  <TableCell padding="checkbox">
                    <IconButton onClick={() => this.handleEdit(user)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
    );
  }
}

/**
 * @namespace
 * @property {Array} users - List of user records.
 * @property {Array} userGroups - List of usergroup records.
 * @property {function} deleteUsers - delete users handler.
 * @property {function} addUser - add user handler.
 * @property {function} editUser - edit user handler.
 */
UserForm.propTypes = {
  users: PropTypes.array,
  userGroups: PropTypes.array,
  deleteUsers: PropTypes.func.isRequired,
  addUser: PropTypes.func.isRequired,
  editUser: PropTypes.func.isRequired,
};

UserForm.defaultProps = {
  users: [],
  userGroups: [],
};

export default UserForm;
