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
import React, { useCallback } from 'react';
import { useQuery } from 'react-query';

import api from '@/services/api';

import AdminTable from './components/AdminTable';

/**
 * View for editing or adding database users.
 */
const AdminView = () => {
  const { data: users = [], refetch: refetchUsers } = useQuery(
    [
      '/query',
      {
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
      },
    ],
    async ({ queryKey: [route, body] }) => api.post(route, body),
  );

  const { data: groups = [], refetch: refetchGroups } = useQuery(
    ['/query', { target: 'UserGroup', neighbors: 2 }],
    async ({ queryKey: [route, body] }) => api.post(route, body),
  );

  const handleUserChange = useCallback(() => {
    refetchUsers();
  }, [refetchUsers]);

  const handleGroupChange = useCallback(() => {
    refetchGroups();
  }, [refetchGroups]);

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
            users.filter((user) => user.email).map((user) => user.email).join(',')
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
