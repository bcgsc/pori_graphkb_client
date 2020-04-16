/**
 * @module /views/AdminView
 */
import './index.scss';

import {
  Button,
  Typography,
} from '@material-ui/core';
import {
  MailOutline,
} from '@material-ui/icons';
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';

import api from '@/services/api';

import AdminTable from './components/AdminTable';

/**
 * View for editing or adding database users.
 */
class AdminView extends Component {
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
  @boundMethod
  async fetchData() {
    const usersCall = api.post('/query', { target: 'User', neighbors: 2 });
    this.controllers.push(usersCall);
    const users = await usersCall.request();

    const userGroupsCall = api.post('/query', { target: 'UserGroup', neighbors: 1 });
    this.controllers.push(userGroupsCall);
    const userGroups = await userGroupsCall.request();

    this.setState({
      users,
      userGroups,
    });
  }

  render() {
    const {
      users,
      userGroups,
    } = this.state;

    if (!users) return null;

    return (
      <div className="admin">
        <Typography className="admin__headline" variant="h1">Admin</Typography>

        <AdminTable
          onChange={this.fetchData}
          records={users}
          variant="User"
        />
        <div className="admin__email-all">
          <a
            href={`mailto:?subject=GraphKB&cc=graphkb@bcgsc.ca&bcc=${
              users.filter(user => user.email).map(user => user.email).join(',')
            }`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Button variant="outlined"> <MailOutline /> &nbsp; mail all users</Button>
          </a>
        </div>
        <AdminTable
          onChange={this.fetchData}
          records={userGroups}
          variant="UserGroup"
        />
      </div>
    );
  }
}

export default AdminView;
