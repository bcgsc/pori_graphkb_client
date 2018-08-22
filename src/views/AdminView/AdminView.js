/**
 * @module /views/AdminView
 */

import React, { Component } from 'react';
import './AdminView.css';
import * as jc from 'json-cycle';
import _ from 'lodash';
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  Checkbox,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField,
  FormGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText,
  Badge,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import PersonIcon from '@material-ui/icons/Person';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import api from '../../services/api';
import auth from '../../services/auth';
import util from '../../services/util';
import config from '../../config.json';

const { PERMISSIONS } = config;

/**
 * View for editing or adding database users.
 */
class AdminView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: null,
      userGroups: null,
      selected: [],
      userDialogOpen: false,
      deleteDialogOpen: false,
      newUserGroupDialog: false,
      newUserName: '',
      newUserGroups: [],
      timerId: null,
      date: '',
      error: false,
      selectedUser: null,
      expanded: [],
      tempUserGroup: null,
      newUserGroup: { name: '', permissions: {} },
      deletedUserGroup: null,
    };

    this.addUser = this.addUser.bind(this);
    this.deleteUsers = this.deleteUsers.bind(this);
    this.deleteUserGroup = this.deleteUserGroup.bind(this);
    this.editUser = this.editUser.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCheckAllUsers = this.handleCheckAllUsers.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleDeleteUserGroup = this.handleDeleteUserGroup.bind(this);
    this.handleDeleteUsersDialog = this.handleDeleteUsersDialog.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleNewUserGroup = this.handleNewUserGroup.bind(this);
    this.handleNewUserGroupChange = this.handleNewUserGroupChange.bind(this);
    this.handleNewUserGroupDialog = this.handleNewUserGroupDialog.bind(this);
    this.handlePermissionsChange = this.handlePermissionsChange.bind(this);
    this.handlePermissionsCommit = this.handlePermissionsCommit.bind(this);
    this.handlePermissionsEdit = this.handlePermissionsEdit.bind(this);
    this.handleTempUserGroupChange = this.handleTempUserGroupChange.bind(this);
    this.handleUserDialog = this.handleUserDialog.bind(this);
    this.handleUserGroupCancel = this.handleUserGroupCancel.bind(this);
    this.handleUserGroupCheckAll = this.handleUserGroupCheckAll.bind(this);
    this.handleUserGroupExpand = this.handleUserGroupExpand.bind(this);
  }

  /**
   * Gets database users and usergroups. Initializes form object.
   */
  async componentDidMount() {
    const { newUserGroup } = this.state;
    const cycledUsers = await api.get('/users?neighbors=1');
    const cycledUserGroups = await api.get('/usergroups');
    const schema = await api.getSchema();
    const users = jc.retrocycle(cycledUsers).result;
    const userGroups = jc.retrocycle(cycledUserGroups).result;
    userGroups.forEach((userGroup) => {
      Object.keys(userGroup.permissions).forEach((key) => {
        userGroup.permissions[key] = util.parsePermission(userGroup.permissions[key]);
      });
    });
    Object.keys(schema).forEach((obj) => { newUserGroup.permissions[obj] = [0, 0, 0, 0]; });
    this.setState({ users, userGroups, newUserGroup });
  }

  /**
   * Clears all asynchronous operations.
   */
  componentWillUnmount() {
    const { timerId } = this.state;
    window.clearInterval(timerId);
  }

  /**
   * Sends a POST request to the database, refreshes new user form model, and
   * updates listed users.
   */
  async addUser() {
    const { newUserName, newUserGroups, users } = this.state;
    if (users.map(u => u.name.toLowerCase())
      .includes(newUserName.toLowerCase()) || !newUserName
    ) {
      this.setState({ error: true });
      return;
    }
    const payload = { name: newUserName, groups: newUserGroups };
    await api.post('/users', payload);
    const newUsers = await api.get('/users?neighbors=1');
    this.setState({
      users: jc.retrocycle(newUsers).result,
      newUserName: '',
      newUserGroups: [],
    }, this.handleUserDialog);
  }

  /**
   * Iterates over selected users and sends a DELETE request to the server for
   * each. Updates users list.
   */
  async deleteUsers() {
    const { selected } = this.state;
    selected.forEach(async (user) => { await api.delete(`/users/${user.slice(1)}`); });
    const newUsers = await api.get('/users?neighbors=1');
    this.setState({
      users: jc.retrocycle(newUsers).result,
      selected: [],
    }, this.handleDeleteUsersDialog);
  }

  /**
   * Sends a DELETE request to the server, then updates user group list.
   * @param {Object} userGroup - usergroup object
   */
  async deleteUserGroup(userGroup) {
    await api.delete(`/usergroups/${userGroup['@rid'].slice(1)}`);
    const userGroups = jc.retrocycle(await api.get('/usergroups')).result;
    userGroups.forEach((ug) => {
      Object.keys(ug.permissions).forEach((key) => {
        ug.permissions[key] = util.parsePermission(ug.permissions[key]);
      });
    });
    this.setState({ userGroups }, this.handleDeleteUserGroup);
  }

  /**
   * Sends a PATCH request to the server, re-initializes new user form model,
   * and updates user list.
   */
  async editUser() {
    const {
      newUserName,
      newUserGroups,
      users,
      selectedUser,
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
    await api.patch(`/users/${selectedUser['@rid'].slice(1)}`, payload);
    const newUsers = await api.get('/users?neighbors=1');
    this.setState({
      users: jc.retrocycle(newUsers).result,
      newUserName: '',
      newUserGroups: [],
    }, this.handleUserDialog);
  }

  /**
   * Updates state from a user input event. Property modified is selected by
   * the input element's name attribute.
   * @param {Event} e - user input event.
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value, error: false });
  }

  /**
   * Selects all users, or clears selected users.
   */
  handleCheckAllUsers() {
    const { selected, users } = this.state;
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
    this.setState({ selected });
  }

  /**
   * Stages usergroup to be deleted and opens usergroup deletion dialog.
   * @param {Object} userGroup - usergroup to be staged for deletion.
   */
  handleDeleteUserGroup(userGroup) {
    const { deletedUserGroup } = this.state;
    this.setState({ deletedUserGroup: deletedUserGroup ? null : userGroup });
  }

  /**
   * Toggles the delete user dialog.
   */
  handleDeleteUsersDialog() {
    const { deleteDialogOpen } = this.state;
    this.setState({ deleteDialogOpen: !deleteDialogOpen });
  }

  /**
   * Copies over user object to temporary model that can be edited, and
   * opens the user editing dialog.
   * @param {Object} user - user object to be edited.
   */
  handleEdit(user) {
    this.setState({
      newUserGroups: (user.groups || []).map(g => g['@rid']),
      newUserName: user.name,
      selectedUser: user,
      userDialogOpen: true,
    });
  }

  /**
   * Toggles a usergroup in the new user form.
   * @param {string} rid - usergroup record identifier to be added/removed
   * from new user list.
   */
  handleNewUserGroup(rid) {
    const { newUserGroups } = this.state;
    const i = newUserGroups.indexOf(rid);
    if (i === -1) {
      newUserGroups.push(rid);
    } else {
      newUserGroups.splice(i, 1);
    }
    this.setState({ newUserGroups });
  }

  /**
   * Updates new UserGroup model with user input.
   * @param {Event} e - user input event.
   */
  handleNewUserGroupChange(e) {
    const { newUserGroup } = this.state;
    newUserGroup[e.target.name] = e.target.value;
    this.setState({ newUserGroup });
  }

  /**
   * Toggles new usergroup dialog.
   */
  handleNewUserGroupDialog() {
    const { newUserGroupDialog } = this.state;
    this.setState({ newUserGroupDialog: !newUserGroupDialog });
  }

  /**
   * Updates UserGroup permission. While being edited or being prepared for
   * posting.
   * @param {string} permissionKey - Permission property key.
   * @param {number} permission - index of permission type([D, U, R, C]).
   * @param {number} currValue - bit representing permission status.
   * @param {boolean} isNewUserGroup - new UserGroup flag.
   */
  handlePermissionsChange(permissionKey, permission, currValue, isNewUserGroup) {
    const { newUserGroup, tempUserGroup } = this.state;

    if (!(isNewUserGroup ? newUserGroup : tempUserGroup)) return;
    (isNewUserGroup ? newUserGroup : tempUserGroup)
      .permissions[permissionKey][permission] = currValue ? 0 : 1;
    this.setState({ isNewUserGroup, tempUserGroup });
  }

  /**
   * Commits UserGroup changes to the server, either by POST or PATCH.
   * @param {boolean} isNewUserGroup - new UserGroup flag.
   */
  async handlePermissionsCommit(isNewUserGroup) {
    const f = isNewUserGroup
      ? (rid, payload) => api.post('/usergroups', payload)
      : (rid, payload) => api.patch(`/usergroups/${rid}`, payload);

    const key = isNewUserGroup ? 'newUserGroup' : 'tempUserGroup';
    const temp = this.state[key];
    const rid = (temp['@rid'] || '').slice(1);

    Object.keys(temp.permissions).forEach((pKey) => {
      const reducer = (accumulator, curr, i) => accumulator + curr * (2 ** i);
      temp.permissions[pKey] = temp.permissions[pKey].reduce(reducer);
    });

    const payload = _.omit(temp, ['@rid', '@type', 'createdBy', 'createdAt', 'uuid', '@class']);
    await f(rid, payload);
    const response = await api.get('/usergroups');
    const userGroups = jc.retrocycle(response).result;
    userGroups.forEach((userGroup) => {
      Object.keys(userGroup.permissions).forEach((pKey) => {
        userGroup.permissions[pKey] = util.parsePermission(userGroup.permissions[pKey]);
      });
    });

    const newUserGroup = { name: '', permissions: {} };
    const schema = await api.getSchema();
    Object.keys(schema).forEach((obj) => { newUserGroup.permissions[obj] = [0, 0, 0, 0]; });

    this.setState({
      [key]: isNewUserGroup
        ? newUserGroup
        : null,
      userGroups: jc.retrocycle(response).result,
    }, this.handleNewUserGroupDialog);
  }

  /**
   * Stages a UserGroup for editing by shallow copying it to the temp UserGroup
   * model.
   * @param {Object} userGroup - UserGroup to be staged for editing.
   */
  handlePermissionsEdit(userGroup) {
    const permissions = Object.assign({}, userGroup.permissions);
    Object.keys(permissions).forEach((key) => { permissions[key] = permissions[key].slice(); });
    const tempUserGroup = { ...userGroup, permissions };
    this.setState({ tempUserGroup });
  }

  /**
   * Updates temporary UserGroup model with a user input value.
   * @param {Event} e - User input event.
   */
  handleTempUserGroupChange(e) {
    const { tempUserGroup } = this.state;
    tempUserGroup[e.target.name] = e.target.value;
    this.setState({ tempUserGroup });
  }

  /**
   * Toggles new user dialog and resets/stops the createdAt timer.
   */
  handleUserDialog() {
    const { userDialogOpen, timerId } = this.state;
    if (timerId) {
      window.clearInterval(timerId);
      this.setState({ timerId: null });
    } else {
      this.setState({
        date: new Date(),
        timerId: window.setInterval(
          () => {
            this.setState({ date: new Date() });
          }, 1000,
        ),
      });
    }
    this.setState({ userDialogOpen: !userDialogOpen });
  }

  /**
   * Clears temporary UserGroup model.
   */
  handleUserGroupCancel() {
    this.setState({ tempUserGroup: null });
  }

  /**
   * Checks/unchecks one column of UserGroup permissions.
   * @param {Event} e - user input checkbox event.
   * @param {number} i - Column index ([D, U, R, C]).
   * @param {boolean} isNewUserGroup - new UserGroup flag.
   */
  handleUserGroupCheckAll(e, i, isNewUserGroup) {
    const { newUserGroup, tempUserGroup } = this.state;
    Object.keys((isNewUserGroup ? newUserGroup : tempUserGroup).permissions).forEach((pKey) => {
      (isNewUserGroup ? newUserGroup : tempUserGroup)
        .permissions[pKey][i] = e.target.checked ? 1 : 0;
    });
    this.setState({ newUserGroup, tempUserGroup });
  }

  /**
   * Given a record ID, toggle corresponding usergroup record's
   * expansion panel in.
   * @param {string} rid - UserGroup record identifier.
   */
  handleUserGroupExpand(rid) {
    const { expanded } = this.state;
    if (expanded.indexOf(rid) !== -1) {
      expanded.splice(expanded.indexOf(rid), 1);
    } else {
      expanded.push(rid);
    }
    this.setState({ expanded });
  }

  render() {
    const {
      users,
      userGroups,
      selected,
      selectedUser,
      userDialogOpen,
      newUserName,
      newUserGroups,
      newUserGroup,
      deleteDialogOpen,
      date,
      error,
      expanded,
      tempUserGroup,
      newUserGroupDialog,
      deletedUserGroup,
    } = this.state;

    if (!users) return null;

    const userGroupPanel = (userGroup, isEditing, newUser) => {
      const permissionKeys = Object.keys(userGroup.permissions)
        .filter(k => k !== '@class' && k !== '@type')
        .sort((a, b) => a > b ? 1 : -1);
      const list = (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="dense" />
              {PERMISSIONS.map(permission => (
                <TableCell padding="checkbox">
                  {`${permission.charAt(0)}${permission.slice(1).toLowerCase()}`}
                </TableCell>
              ))}
            </TableRow>
            <TableRow id="admin-sticky-row">
              <TableCell padding="dense" />
              {PERMISSIONS.map((p, i) => (
                <TableCell padding="checkbox">
                  <Checkbox
                    onChange={e => this.handleUserGroupCheckAll(e, i, newUser)}
                    disabled={!isEditing}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {permissionKeys
              .map(permission => (
                <TableRow key={permission} className="permissions-view">
                  <TableCell padding="dense">
                    <Typography variant="body1" component="p">
                      {permission}:
                    </Typography>
                  </TableCell>
                  {userGroup.permissions[permission].map((p, j) => (
                    <TableCell padding="checkbox" key={`${userGroup.name}${permission}${j.toString()}`}>
                      <Checkbox
                        onChange={() => this.handlePermissionsChange(
                          permission,
                          j, p,
                          newUser,
                        )}
                        checked={!!p}
                        disabled={!isEditing}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      );
      return (
        <div className="user-group-grid">
          {list}
        </div>);
    };

    const userDialog = (edit) => {
      const isTaken = users.map(u => u.name.toLowerCase()).includes(newUserName.toLowerCase());
      const isSelected = edit
        ? selectedUser.name.toLowerCase() === newUserName.toLowerCase()
        : false;
      return (
        <Dialog
          open={userDialogOpen}
          onClose={this.handleUserDialog}
          maxWidth={false}
          classes={{
            paper: 'new-user-dialog',
          }}
        >
          <DialogTitle>
            {edit ? 'Edit User' : 'New User'}
          </DialogTitle>
          <DialogContent classes={{ root: 'new-user-dialog-content' }}>
            <div className="new-user-form">
              <FormControl
                error={(isTaken && !isSelected) || error}
              >
                <TextField
                  onChange={this.handleChange}
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
                <FormGroup>
                  {userGroups.map(userGroup => (
                    <FormControlLabel
                      key={userGroup['@rid']}
                      control={(
                        <Checkbox
                          checked={newUserGroups.includes(userGroup['@rid'])}
                          onChange={() => this.handleNewUserGroup(userGroup['@rid'])}
                        />)}
                      label={userGroup.name}
                    />))}
                </FormGroup>
              </FormControl>
            </div>
            <Paper className="paper new-user-preview">
              <div className="preview-name">
                <Avatar classes={{ colorDefault: newUserName ? 'avatar-colored' : '' }}>
                  {newUserName.charAt(0).toUpperCase() || <PersonIcon />}
                </Avatar>
                <Typography component="h3" variant="subheading">
                  {newUserName || <Typography color="textSecondary">[New User]</Typography>}
                </Typography>
              </div>
              <div className="preview-metadata">
                <div className="metadata-line">
                  <Typography variant="body2" component="h4">Created By:</Typography>
                  <Typography variant="caption" component="p">
                    {edit ? (selectedUser.createdBy || {}).name : auth.getUser()}
                  </Typography>
                </div>
                <div className="metadata-line">
                  <Typography variant="body2" component="h4">Created At:</Typography>
                  <Typography variant="caption" component="p">
                    {edit ? new Date(selectedUser.createdAt).toLocaleString()
                      : date.toLocaleString()}
                  </Typography>
                </div>
              </div>
              <div className={`preview-groups ${newUserGroups.length === 0 && 'no-groups'}`}>
                <Typography variant="body2" component="h4">
                  Groups:
                </Typography>
                {newUserGroups.length !== 0 ? newUserGroups.map(group => (
                  <Chip
                    key={group}
                    label={userGroups.find(g => g['@rid'] === group).name}
                    className="group-chip"
                    color="primary"
                  />)) : <Typography component="p" variant="caption">No groups</Typography>}
              </div>
            </Paper>
          </DialogContent>
          <DialogActions style={{ justifyContent: 'center' }}>
            <Button onClick={this.handleUserDialog}>
              Cancel
            </Button>
            <Button onClick={edit ? this.editUser : this.addUser}>
              {edit ? 'Confirm Changes' : 'Add User'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    };

    const deleteUsersDialog = (
      <Dialog
        open={deleteDialogOpen && selected.length !== 0}
        onClose={this.handleDeleteUsersDialog}
        classes={{
          paper: 'delete-dialog',
        }}
      >
        <DialogTitle>
          Delete Users?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
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
                      <IconButton onClick={() => this.handleCheckbox(rid)}>
                        <CancelIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                    <ListItemText primary={user.name} />
                  </ListItem>
                );
              })}
            </List>
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button onClick={this.handleDeleteUsersDialog}>
            Cancel
          </Button>
          <Button onClick={() => this.deleteUsers()}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    );

    const userGroupDialog = (
      <Dialog
        open={newUserGroupDialog}
        onClose={this.handleNewUserGroupDialog}
        classes={{
          paper: '',
        }}
        maxWidth={false}
      >
        <DialogTitle>
          New User Group
        </DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            value={newUserGroup.name}
            onChange={e => this.handleNewUserGroupChange(e, true)}
            label="Name"
            placeholder="Enter Group Name"
          />
          {userGroupPanel(newUserGroup, true, true)}
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button onClick={() => this.handlePermissionsCommit(true)}>Add</Button>
          <Button onClick={this.handleNewUserGroupDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    );

    const deleteUserGroupDialog = (
      <Dialog
        open={!!deletedUserGroup}
        onClose={this.handleDeleteUserGroup}
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
          <Button onClick={this.handleDeleteUserGroup}>
            No
          </Button>
          <Button onClick={() => this.deleteUserGroup(deletedUserGroup)}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    );

    return (
      <div className="admin-wrapper">
        {userDialog(!!selectedUser)}
        {deleteUsersDialog}
        {userGroupDialog}
        {deleteUserGroupDialog}
        <Paper className="paper admin-headline">
          <Typography component="h1" variant="headline">Admin</Typography>
        </Paper>
        <Paper className="paper admin-users">
          <div className="admin-section-heading">
            <Typography component="h2" variant="title">Users</Typography>
            <div className="admin-section-heading-btns">
              <IconButton
                disabled={selected.length === 0}
                onClick={this.handleDeleteUsersDialog}
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
          <Table>
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
                <TableCell>Created At</TableCell>
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
                  <TableCell>
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
        </Paper>
        <Paper className="paper admin-user-groups">
          <div className="admin-section-heading">
            <Typography component="h2" variant="title">User Groups</Typography>
            <div className="admin-section-heading-btns">
              <IconButton onClick={this.handleNewUserGroupDialog}>
                <AddIcon />
              </IconButton>
            </div>
          </div>
          {userGroups.map((userGroup) => {
            const isEditing = tempUserGroup && userGroup['@rid'] === tempUserGroup['@rid'];
            if (isEditing) {
              userGroup = tempUserGroup;
            }

            return (
              <ExpansionPanel
                key={userGroup['@rid']}
                expanded={expanded.includes(userGroup['@rid'])}
                className={isEditing ? 'editedGroup' : ''}
                onChange={() => this.handleUserGroupExpand(userGroup['@rid'])}
              >
                <ExpansionPanelSummary
                  expandIcon={<KeyboardArrowDownIcon />}
                >
                  {userGroup.name}
                </ExpansionPanelSummary>
                {expanded.includes(userGroup['@rid'])
                  ? (
                    <ExpansionPanelDetails classes={{ root: 'user-group-body' }}>
                      <div className="user-group-toolbar">
                        {isEditing
                          ? (
                            <React.Fragment>
                              <Button
                                onClick={() => this.handlePermissionsCommit(false)}
                                size="small"
                                variant="outlined"
                              >
                                Confirm
                              </Button>
                              <Button
                                onClick={this.handleUserGroupCancel}
                                size="small"
                                variant="outlined"
                              >
                                Cancel
                              </Button>
                              <TextField
                                name="name"
                                value={userGroup.name}
                                onChange={e => this.handleTempUserGroupChange(e, false)}
                                label="Name"
                                placeholder="Enter Group Name"
                                style={{ marginRight: 'auto' }}
                              />
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              <IconButton onClick={() => this.handlePermissionsEdit(userGroup)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton onClick={() => this.handleDeleteUserGroup(userGroup)}>
                                <DeleteIcon />
                              </IconButton>
                              <Typography component="h3" variant="subheading">Permissions</Typography>
                            </React.Fragment>
                          )}
                      </div>
                      {userGroupPanel(userGroup, isEditing)}
                    </ExpansionPanelDetails>
                  ) : null}
              </ExpansionPanel>
            );
          })}
        </Paper>
      </div>
    );
  }
}

AdminView.propTypes = {};

export default withStyles({})(AdminView);
