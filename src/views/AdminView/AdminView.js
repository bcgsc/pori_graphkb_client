/**
 * @module /views/AdminView
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import {
  Paper,
  Typography,
} from '@material-ui/core';

import './AdminView.scss';
import { KBContext } from '../../components/KBContext';
import { UserForm, UserGroupForm } from './components';
import api from '../../services/api';
import util from '../../services/util';

/**
 * View for editing or adding database users.
 */
class AdminView extends Component {
  static contextType = KBContext;

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
    };
    this.controllers = [];
  }

  async componentDidMount() {
    await this.fetchData();
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  /**
   * Gets database users and usergroups. Initializes form object.
   */
  async fetchData() {
    const usersCall = api.get('/users?neighbors=1');
    this.controllers.push(usersCall);
    const users = await usersCall.request();

    const userGroupsCall = api.get('/usergroups?neighbors=1');
    this.controllers.push(userGroupsCall);
    const userGroups = await userGroupsCall.request();

    this.setState({
      users,
      userGroups,
    });
  }

  /**
   * Sends a POST request to the database, refreshes new user form model, and
   * updates listed users.
   * @param {Object} payload - New User record payload.
   */
  @boundMethod
  async addUser(payload) {
    const call = api.post('/users', payload);
    this.controllers.push(call);
    await call.request();
    await this.fetchData();
  }

  /**
   * Iterates over selected users and sends a DELETE request to the server for
   * each. Updates users list.
   * @param {Array.<string>} selected - List of record ID's to delete.
   */
  @boundMethod
  async deleteUsers(selected) {
    const deletes = [];
    selected.forEach((user) => {
      const call = api.delete(`/users/${user.slice(1)}`);
      deletes.push(call);
    });
    this.components.push(...deletes);
    await Promise.all(deletes.map(async c => c.request()));
    await this.fetchData();
  }

  /**
   * Sends a DELETE request to the server, then updates user group list.
   * @param {string} rid - usergroup object rid.
   */
  @boundMethod
  async deleteUserGroup(rid) {
    const call = api.delete(`/usergroups/${rid}`);
    this.controllers.push(call);
    await call.request();
    await this.fetchData();
  }

  /**
   * Sends a PATCH request to the server, re-initializes new user form model,
   * and updates user list.
   * @param {string} - User record ID.
   * @param {Object} payload - User record payload.
   */
  @boundMethod
  async editUser(rid, payload) {
    const call = api.patch(`/users/${rid}`, payload);
    this.controllers.push(call);
    await call.request();
    await this.fetchData();
  }


  /**
   * PATCHes UserGroup record.
   * @param {string} rid - Usergroup record ID.
   * @param {Object} payload - UserGroup record payload.
   */
  @boundMethod
  async patchUserGroup(rid, payload) {
    const call = api.patch(`/usergroups/${rid}`, payload);
    this.controllers.push(call);
    await call.request();
    await this.fetchData();
  }

  /**
   * POSTs new UserGroup record.
   * @param {Object} payload - User record payload.
   */
  @boundMethod
  async postUserGroup(payload) {
    const call = api.post('/usergroups', payload);
    this.controllers.push(call);
    await call.request();
    await this.fetchData();
  }

  render() {
    const {
      users,
      userGroups,
    } = this.state;
    const { schema } = this.context;

    if (!users) return null;

    return (
      <div className="admin">
        <Paper className="admin__headline">
          <Typography variant="h5">Admin</Typography>
        </Paper>
        <UserForm
          deleteUsers={this.deleteUsers}
          users={users}
          userGroups={userGroups}
          addUser={this.addUser}
          editUser={this.editUser}
        />
        <UserGroupForm
          userGroups={userGroups}
          schema={schema}
          onAdd={this.postUserGroup}
          onEdit={this.patchUserGroup}
          onDelete={this.deleteUserGroup}
        />
      </div>
    );
  }
}

export default AdminView;
