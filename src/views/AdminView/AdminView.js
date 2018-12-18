/**
 * @module /views/AdminView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './AdminView.css';
import * as jc from 'json-cycle';
import {
  Paper,
  Typography,
} from '@material-ui/core';
import { withKB } from '../../components/KBContext';
import UserForm from '../../components/UserForm';
import UserGroupForm from '../../components/UserGroupForm';
import api from '../../services/api';
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
    };

    this.addUser = this.addUser.bind(this);
    this.deleteUsers = this.deleteUsers.bind(this);
    this.deleteUserGroup = this.deleteUserGroup.bind(this);
    this.editUser = this.editUser.bind(this);
    this.patchUserGroup = this.patchUserGroup.bind(this);
    this.postUserGroup = this.postUserGroup.bind(this);
  }

  /**
   * Gets database users and usergroups. Initializes form object.
   */
  async componentDidMount() {
    const cycledUsers = await api.get('/users?neighbors=1');
    const cycledUserGroups = await api.get('/usergroups');
    const users = jc.retrocycle(cycledUsers).result;
    const userGroups = AdminViewBase.initializeUserGroups(jc.retrocycle(cycledUserGroups).result);

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
  async addUser(payload) {
    await api.post('/users', payload);
    this.componentDidMount();
  }

  /**
   * Iterates over selected users and sends a DELETE request to the server for
   * each. Updates users list.
   * @param {Array.<string>} selected - List of record ID's to delete.
   */
  async deleteUsers(selected) {
    const deletes = [];
    selected.forEach((user) => { deletes.push(api.delete(`/users/${user.slice(1)}`)); });
    await Promise.all(deletes);
    this.componentDidMount();
  }

  /**
   * Sends a DELETE request to the server, then updates user group list.
   * @param {string} rid - usergroup object rid.
   */
  async deleteUserGroup(rid) {
    await api.delete(`/usergroups/${rid}`);
    this.componentDidMount();
  }

  /**
   * Sends a PATCH request to the server, re-initializes new user form model,
   * and updates user list.
   * @param {string} - User record ID.
   * @param {Object} payload - User record payload.
   */
  async editUser(rid, payload) {
    await api.patch(`/users/${rid}`, payload);
    this.componentDidMount();
  }


  /**
   * PATCHes UserGroup record.
   * @param {string} rid - Usergroup record ID.
   * @param {Object} payload - UserGroup record payload.
   */
  async patchUserGroup(rid, payload) {
    await api.patch(`/usergroups/${rid}`, payload);
    this.componentDidMount();
  }

  /**
   * POSTs new UserGroup record.
   * @param {Object} payload - User record payload.
   */
  async postUserGroup(payload) {
    await api.post('/usergroups', payload);
    this.componentDidMount();
  }

  render() {
    const {
      users,
      userGroups,
    } = this.state;
    const { schema } = this.props;

    if (!users) return null;

    return (
      <div className="admin-wrapper">
        <Paper className="admin-headline">
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
