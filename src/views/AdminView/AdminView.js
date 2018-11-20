/**
 * @module /views/AdminView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './AdminView.css';
import * as jc from 'json-cycle';
import omit from 'lodash.omit';
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
import PersonIcon from '@material-ui/icons/Person';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import PermissionsTable from '../../components/PermissionsTable/PermissionsTable';
import { withKB } from '../../components/KBContext/KBContext';
import api from '../../services/api';
import auth from '../../services/auth';
import util from '../../services/util';

/**
 * View for editing or adding database users.
 */
class AdminViewBase extends Component {
  static initializeUserGroups(userGroups) {
    const newUserGroups = [];
    userGroups.forEach((u, i) => {
      const userGroup = userGroups[i];
      Object.keys(userGroup.permissions).forEach((pKey) => {
        if (pKey !== '@class' && pKey !== '@type') {
          userGroup.permissions[pKey] = util.parsePermission(userGroup.permissions[pKey]);
        } else {
          delete userGroup.permissions[pKey];
        }
      });
      newUserGroups.push(userGroup);
    });

    return newUserGroups;
  }

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
    this.handleEdit = this.handleEdit.bind(this);
    this.handleNewUserGroup = this.handleNewUserGroup.bind(this);
    this.handlePermissionsChange = this.handlePermissionsChange.bind(this);
    this.handlePermissionsCommit = this.handlePermissionsCommit.bind(this);
    this.handlePermissionsEdit = this.handlePermissionsEdit.bind(this);
    this.handleUserDialog = this.handleUserDialog.bind(this);
    this.handleUserGroupCheckAll = this.handleUserGroupCheckAll.bind(this);
    this.handleUserGroupExpand = this.handleUserGroupExpand.bind(this);
  }

  /**
   * Gets database users and usergroups. Initializes form object.
   */
  async componentDidMount() {
    const { newUserGroup } = this.state;
    const { schema } = this.props;
    const cycledUsers = await api.get('/users?neighbors=1');
    const cycledUserGroups = await api.get('/usergroups');
    const users = jc.retrocycle(cycledUsers).result;
    const userGroups = AdminViewBase.initializeUserGroups(jc.retrocycle(cycledUserGroups).result);

    Object.keys(schema.schema)
      .forEach((obj) => { newUserGroup.permissions[obj] = [0, 0, 0, 0]; });
    this.setState({
      users,
      userGroups,
      newUserGroup,
    });
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
    const deletes = [];
    selected.forEach((user) => { deletes.push(api.delete(`/users/${user.slice(1)}`)); });
    await Promise.all(deletes);
    const newUsers = await api.get('/users?neighbors=1');
    this.setState({
      users: jc.retrocycle(newUsers).result,
      selected: [],
      deleteDialogOpen: false,
    });
  }

  /**
   * Sends a DELETE request to the server, then updates user group list.
   * @param {Object} userGroup - usergroup object
   */
  async deleteUserGroup(userGroup) {
    await api.delete(`/usergroups/${userGroup['@rid'].slice(1)}`);
    const userGroups = AdminViewBase.initializeUserGroups(
      jc.retrocycle(
        await api.get('/usergroups'),
      ).result,
    );

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
   * Handles change of a nested property.
   * @param {Event} e - user change event.
   * @param {string} nKey - state nested key.
   */
  handleNestedChange(e, nKey) {
    const { [nKey]: obj } = this.state;
    obj[e.target.name] = e.target.value;
    this.setState({ [nKey]: obj });
  }

  /**
   * Updates UserGroup permission. While being edited or being prepared for
   * posting.
   * @param {string} permissionKey - Permission property key.
   * @param {number} permission - index of permission type([D, U, R, C]).
   * @param {number} currValue - bit representing permission status.
   * @param {string} key - key of group to be edited.
   */
  handlePermissionsChange(permissionKey, permission, currValue, key) {
    const { [key]: userGroup } = this.state;
    if (!userGroup) return;
    userGroup.permissions[permissionKey][permission] = currValue ? 0 : 1;
    this.setState({ [key]: userGroup });
  }

  /**
   * Commits UserGroup changes to the server, either by POST or PATCH.
   * @param {boolean} isNewUserGroup - new UserGroup flag.
   */
  async handlePermissionsCommit(isNewUserGroup) {
    const { schema } = this.props;
    const f = isNewUserGroup
      ? (rid, payload) => api.post('/usergroups', payload)
      : (rid, payload) => api.patch(`/usergroups/${rid}`, payload);

    const key = isNewUserGroup ? 'newUserGroup' : 'tempUserGroup';
    const { [key]: temp, userGroups } = this.state;
    const rid = (temp['@rid'] || '').slice(1);

    if (
      (userGroups
        .map(u => u.name.toLowerCase())
        .includes(temp.name.toLowerCase())
        || !temp.name)
      && isNewUserGroup
    ) {
      return;
    }
    const tempPermissions = {};
    Object.keys(temp.permissions)
      .filter(pKey => pKey !== '@type' && pKey !== '@class')
      .forEach((pKey) => {
        const reducer = (accumulator, curr, i) => accumulator + curr * (2 ** i);
        tempPermissions[pKey] = temp.permissions[pKey].reduce(reducer);
      });

    const payload = omit(temp, ['@rid', '@type', 'createdBy', 'createdAt', 'uuid', '@class', 'permissions']);
    payload.permissions = tempPermissions;

    await f(rid, payload);
    const response = await api.get('/usergroups');
    const newUserGroups = AdminViewBase.initializeUserGroups(jc.retrocycle(response).result);
    const newUserGroup = { name: '', permissions: {} };

    Object.keys(schema.schema).forEach((obj) => { newUserGroup.permissions[obj] = [0, 0, 0, 0]; });

    this.setState({
      [key]: isNewUserGroup
        ? newUserGroup
        : null,
      userGroups: newUserGroups,
      newUserGroupDialog: false,
    });
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
    if (userDialogOpen) {
      this.setState({
        newUserName: '',
        newUserGroups: [],
      });
    }
    this.setState({ userDialogOpen: !userDialogOpen });
  }

  /**
   * Checks/unchecks one column of UserGroup permissions.
   * @param {Event} e - user input checkbox event.
   * @param {number} i - Column index ([D, U, R, C]).
   * @param {string} key - which object to edit.
   */
  handleUserGroupCheckAll(e, i, key) {
    const { [key]: userGroup } = this.state;
    const { schema } = this.props;
    Object.keys((userGroup).permissions).forEach((pKey) => {
      const { isEdge, isAbstract } = schema.get(pKey);
      userGroup.permissions[pKey][i] = (e.target.checked
        && !(isEdge && i === 1))
        && !(isAbstract && i !== 2)
        ? 1 : 0;
    });
    this.setState({ [key]: userGroup });
  }

  /**
   * Given a record ID, toggle corresponding usergroup record's
   * expansion panel in.
   * @param {string} rid - UserGroup record identifier.
   */
  handleUserGroupExpand(rid) {
    const { expanded, tempUserGroup } = this.state;
    let cancelFlag = false;
    if (expanded.indexOf(rid) !== -1) {
      expanded.splice(expanded.indexOf(rid), 1);
      if (tempUserGroup && tempUserGroup['@rid'] === rid) {
        cancelFlag = true;
      }
    } else {
      expanded.push(rid);
    }
    this.setState({ expanded, tempUserGroup: cancelFlag ? tempUserGroup : null });
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
    const { schema } = this.props;

    if (!users) return null;

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
            <Paper className="new-user-preview">
              <div className="preview-name">
                <Avatar classes={{ colorDefault: newUserName ? 'avatar-colored' : '' }}>
                  {newUserName.charAt(0).toUpperCase() || <PersonIcon />}
                </Avatar>
                <Typography component="h3" variant="subtitle1">
                  {newUserName || <Typography color="textSecondary">[New User]</Typography>}
                </Typography>
              </div>
              <div className="preview-metadata">
                <div className="metadata-line">
                  <Typography variant="body1" component="h4">Created By:</Typography>
                  <Typography variant="caption" component="p">
                    {edit ? (selectedUser.createdBy || {}).name : auth.getUser()}
                  </Typography>
                </div>
                <div className="metadata-line">
                  <Typography variant="body1" component="h4">Created At:</Typography>
                  <Typography variant="caption" component="p">
                    {edit ? new Date(selectedUser.createdAt).toLocaleString()
                      : date.toLocaleString()}
                  </Typography>
                </div>
              </div>
              <div className={`preview-groups ${newUserGroups.length === 0 && 'no-groups'}`}>
                <Typography variant="body1" component="h4">
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
            <Button
              onClick={edit ? this.editUser : this.addUser}
              disabled={(isTaken && !isSelected) || error}
            >
              {edit ? 'Confirm Changes' : 'Add User'}
            </Button>
          </DialogActions>
        </Dialog>
      );
    };

    const deleteUsersDialog = (
      <Dialog
        open={deleteDialogOpen && selected.length !== 0}
        onClose={() => this.handleChange({ target: { name: 'deleteDialogOpen', value: false } })}
        classes={{
          paper: 'delete-dialog',
        }}
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
                    <IconButton onClick={() => this.handleCheckbox(rid)}>
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
          <Button onClick={() => this.handleChange({ target: { name: 'deleteDialogOpen', value: false } })}>
            Cancel
          </Button>
          <Button onClick={() => this.deleteUsers()}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    );

    const userGroupDialog = () => {
      const isTaken = userGroups
        .map(u => u.name.toLowerCase())
        .includes(newUserGroup.name.toLowerCase());
      return (
        <Dialog
          open={newUserGroupDialog}
          onClose={() => this.handleChange({ target: { name: 'newUserGroupDialog', value: false } })}
          classes={{
            paper: 'new-usergroup-dialog',
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            New User Group
          </DialogTitle>
          <DialogContent>
            <FormControl
              error={isTaken || error}
            >
              <TextField
                name="name"
                value={newUserGroup.name}
                onChange={e => this.handleNestedChange(e, 'newUserGroup')}
                label="Name"
                placeholder="Enter Group Name"
                error={isTaken || error}
              />
              {(isTaken || error)
                && <FormHelperText>UserGroup name already exists</FormHelperText>
              }
            </FormControl>
            <PermissionsTable
              userGroup={newUserGroup}
              stateKey="newUserGroup"
              schema={schema}
              handleChange={this.handlePermissionsChange}
              handleCheckAll={this.handleUserGroupCheckAll}
            />
          </DialogContent>
          <DialogActions style={{ justifyContent: 'center' }}>
            <Button
              disabled={isTaken || error}
              onClick={() => this.handlePermissionsCommit(true)}
            >
              Add
            </Button>
            <Button onClick={() => this.handleChange({ target: { name: 'newUserGroupDialog', value: false } })}>Cancel</Button>
          </DialogActions>
        </Dialog>
      );
    };

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
        {userGroupDialog()}
        {deleteUserGroupDialog}
        <Paper className="admin-headline">
          <Typography variant="h5">Admin</Typography>
        </Paper>
        <Paper className="admin-users">
          <div className="admin-section-heading">
            <Typography component="h2" variant="h6">Users</Typography>
            <div className="admin-section-heading-btns">
              <IconButton
                disabled={selected.length === 0}
                onClick={() => this.handleChange({ target: { name: 'deleteDialogOpen', value: false } })}
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
          </div>
        </Paper>
        <Paper className="admin-user-groups">
          <div className="admin-section-heading">
            <Typography component="h2" variant="h6">User Groups</Typography>
            <div className="admin-section-heading-btns">
              <IconButton onClick={() => this.handleChange({ target: { name: 'newUserGroupDialog', value: true } })}>
                <AddIcon />
              </IconButton>
            </div>
          </div>
          {userGroups.map((u) => {
            let userGroup = u;
            const isEditing = tempUserGroup && userGroup['@rid'] === tempUserGroup['@rid'];
            let isTaken = false;
            let isSelected;
            if (isEditing) {
              isSelected = userGroup.name === tempUserGroup.name;
              userGroup = tempUserGroup;
              isTaken = userGroups
                .map(uG => uG.name.toLowerCase())
                .includes(userGroup.name.toLowerCase());
            }

            return (
              <ExpansionPanel
                key={userGroup['@rid']}
                expanded={expanded.includes(userGroup['@rid'])}
                className={isEditing ? 'editedGroup' : ''}
                onChange={() => this.handleUserGroupExpand(userGroup['@rid'])}
                CollapseProps={{ unmountOnExit: true }}
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
                                onClick={() => this.handleChange({ target: { name: 'tempUserGroup', value: null } })}
                                size="small"
                                variant="outlined"
                              >
                                Cancel
                              </Button>

                              <FormControl
                                error={(isTaken && !isSelected) || error}
                              >
                                <TextField
                                  name="name"
                                  value={userGroup.name}
                                  onChange={e => this.handleNestedChange(e, 'tempUserGroup')}
                                  label="Name"
                                  placeholder="Enter Group Name"
                                  style={{ marginRight: 'auto' }}
                                  error={(isTaken && !isSelected) || error}
                                />
                                {((isTaken && !isSelected) || error)
                                  && <FormHelperText>UserGroup name already exists</FormHelperText>
                                }
                              </FormControl>
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              <IconButton onClick={() => this.handlePermissionsEdit(userGroup)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton onClick={() => this.handleDeleteUserGroup(userGroup)}>
                                <DeleteIcon />
                              </IconButton>
                              <Typography component="h3" variant="subtitle1">Permissions</Typography>
                            </React.Fragment>
                          )}
                      </div>
                      <PermissionsTable
                        userGroup={userGroup}
                        stateKey="tempUserGroup"
                        disabled={!isEditing}
                        schema={schema}
                        handleChange={this.handlePermissionsChange}
                        handleCheckAll={this.handleUserGroupCheckAll}
                      />
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

/**
 * @namespace
 * @property {Object} schema - Knowledgebase schema object.
 */
AdminViewBase.propTypes = {
  schema: PropTypes.object.isRequired,
};

const AdminView = withKB(AdminViewBase);

/**
 * Export consumer component and regular component for testing.
 */
export {
  AdminView,
  AdminViewBase,
};
