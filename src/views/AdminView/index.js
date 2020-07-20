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
import React, {
  useCallback, useEffect, useState,
} from 'react';

import api from '@/services/api';

import AdminTable from './components/AdminTable';

/**
 * View for editing or adding database users.
 */
const AdminView = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userRefresh, setUserRefresh] = useState(true);
  const [groupRefresh, setGroupRefresh] = useState(true);

  useEffect(() => {
    let controller;

    const getData = async () => {
      controller = api.post('/query', {
        target: 'User',
        neighbors: 2,
        returnProperties: [
          '@class',
          '@rid',
          'createdAt',
          'email',
          'groups.@class',
          'groups.@rid',
          'groups.name',
          'name',
          'signedLicenseAt',
        ],
      });
      const result = await controller.request();
      setUsers(result);
      setUserRefresh(false);
    };

    if (userRefresh) {
      getData();
    }
    return () => controller && controller.abort();
  }, [userRefresh]);

  useEffect(() => {
    let controller;

    const getData = async () => {
      controller = api.post('/query', { target: 'UserGroup', neighbors: 2 });
      const result = await controller.request();
      setGroups(result);
      setGroupRefresh(false);
    };

    if (groupRefresh) {
      getData();
    }
    return () => controller && controller.abort();
  }, [groupRefresh]);

  const handleUserChange = useCallback(() => {
    setUserRefresh(true);
  }, []);

  const handleGroupChange = useCallback(() => {
    setGroupRefresh(true);
  }, []);

  if (!users) return null;

  return (
    <div className="admin">
      <Typography className="admin__headline" variant="h1">Admin</Typography>

      <AdminTable
        onChange={handleUserChange}
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
        onChange={handleGroupChange}
        records={groups}
        variant="UserGroup"
      />
    </div>
  );
};

export default AdminView;
