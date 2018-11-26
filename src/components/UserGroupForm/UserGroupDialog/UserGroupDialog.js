/* eslint-disable */
import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  TextField,
  FormControl,
  FormHelperText,
} from '@material-ui/core';
import PermissionsTable from '../../PermissionsTable/PermissionsTable';

function UserGroupDialog(props) {
  const {
    userGroups,
    open,
    tempUserGroupPermissions,
    tempUserGroupName,
    onClose,
    schema,
    handleChange,
    handlePermissionsChange,
    handlePermissionsCheckAll,
    onSubmit,
  } = props;

  const isTaken = userGroups
    .map(u => u.name.toLowerCase())
    .includes(tempUserGroupName.toLowerCase());

  return (
    <Dialog
      open={!!open}
      onClose={onClose}
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
          error={isTaken}
        >
          <TextField
            name="tempUserGroupName"
            value={tempUserGroupName}
            onChange={handleChange}
            label="Name"
            placeholder="Enter Group Name"
            error={isTaken}
          />
          {(isTaken)
            && <FormHelperText>UserGroup name already exists</FormHelperText>
          }
        </FormControl>
        <PermissionsTable
          permissions={tempUserGroupPermissions}
          stateKey="newUserGroup"
          schema={schema}
          handleChange={handlePermissionsChange}
          handleCheckAll={handlePermissionsCheckAll}
        />
      </DialogContent>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button
          disabled={isTaken}
          onClick={onSubmit}
        >
          Add
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserGroupDialog;
