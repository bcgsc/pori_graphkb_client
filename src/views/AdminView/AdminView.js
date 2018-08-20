/**
 * @module /views/AdminView
 */

import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import './AdminView.css';
import * as jc from 'json-cycle';
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
} from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';
import api from '../../services/api';
import auth from '../../services/auth';

/**
 * View for editing or adding database users.
 */
class AdminView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: null,
      selected: [],
      userDialogOpen: false,
      deleteDialogOpen: false,
      // New User
      newUserName: '',
      newUserGroups: [],
      timerId: null,
      date: '',
      error: false,
      selectedUser: null,
    };

    this.addUser = this.addUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.deleteUsers = this.deleteUsers.bind(this);
    this.editUser = this.editUser.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCheckAll = this.handleCheckAll.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleDeleteDialog = this.handleDeleteDialog.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleUserDialog = this.handleUserDialog.bind(this);
    this.handleNewUserGroup = this.handleNewUserGroup.bind(this);
  }

  async componentDidMount() {
    const cycledUsers = await api.get('/users?neighbors=1');
    const cycledUserGroups = await api.get('/usergroups');
    const users = jc.retrocycle(cycledUsers).result;
    const userGroups = jc.retrocycle(cycledUserGroups).result;
    console.log(userGroups);
    this.setState({ users, userGroups });
  }

  async addUser() {
    const { newUserName, newUserGroups, users } = this.state;
    if (users.map(u => u.name.toLowerCase()).includes(newUserName.toLowerCase()) || !newUserName) {
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

  deleteUsers() {
    const { selected } = this.state;
    selected.forEach(user => this.deleteUser(user.slice(1)));
    this.setState({ selected: [] }, this.handleEllipsisClose);
  }

  async deleteUser(rid) {
    await api.delete(`/users/${rid}`);
    const newUsers = await api.get('/users?neighbors=1');
    this.setState({ users: jc.retrocycle(newUsers).result }, this.handleDeleteDialog);
  }

  async editUser() {
    const {
      newUserName,
      newUserGroups,
      users,
      selectedUser,
    } = this.state;

    const isTaken = users.map(u => u.name.toLowerCase()).includes(newUserName.toLowerCase());
    const isSelected = selectedUser.name.toLowerCase() !== newUserName.toLowerCase();
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

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value, error: false });
  }

  handleCheckAll() {
    const { selected, users } = this.state;
    let newSelected;
    if (selected.length === users.length) {
      newSelected = [];
    } else {
      newSelected = users.map(u => u['@rid']);
    }
    this.setState({ selected: newSelected });
  }

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

  handleDeleteDialog() {
    const { deleteDialogOpen } = this.state;
    this.setState({ deleteDialogOpen: !deleteDialogOpen });
  }

  handleEdit(user) {
    this.setState({
      newUserGroups: (user.groups || []).map(g => g['@rid']),
      newUserName: user.name,
      selectedUser: user,
      userDialogOpen: true,
    });
  }

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

  render() {
    const {
      users,
      userGroups,
      selected,
      selectedUser,
      userDialogOpen,
      newUserName,
      newUserGroups,
      deleteDialogOpen,
      date,
      error,
    } = this.state;

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
                    {edit ? selectedUser.createdBy.name : auth.getUser()}
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
        onClose={this.handleDeleteDialog}
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
                  <ListItem>
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
          <Button onClick={this.handleDeleteDialog}>
            Cancel
          </Button>
          <Button onClick={() => this.deleteUsers()}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    );

    return (
      <div className="admin-wrapper">
        {userDialog(!!selectedUser)}
        {deleteUsersDialog}
        <Paper className="paper admin-headline">
          <Typography component="h1" variant="headline">Admin</Typography>
        </Paper>
        <Paper className="paper admin-users">
          <div className="table-heading">
            <Typography component="h2" variant="title">Users</Typography>
            <div className="table-heading-btns">
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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    onChange={this.handleCheckAll}
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
          <div className="users-btns">
            <Button
              color="primary"
              onClick={this.handleUserDialog}
              variant="raised"
              size="small"
            >
              Add New User
            </Button>
          </div>
        </Paper>
        <Paper className="paper admin-user-groups">
          <Typography component="h2" variant="title">User Groups</Typography>
        </Paper>
      </div>
    );
  }
}

AdminView.propTypes = {};

export default AdminView;
