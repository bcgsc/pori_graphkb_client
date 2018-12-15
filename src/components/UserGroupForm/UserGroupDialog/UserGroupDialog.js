import React from 'react';
import PropTypes from 'prop-types';
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

/**
 * New UserGroup dialog component.
 */
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

/**
 * @namespace
 * @property {Array} userGroups - List of usergroup records.
 * @property {boolean} open - Dialog open state.
 * @property {Object} tempUserGroupPermissions - Form permissions object.
 * @property {string} tempUserGroupName - Form name string.
 * @property {Object} schema - Knowledgebase schema object.
 * @property {function} onClose - Handler on dialog close.
 * @property {function} handleChange - Form input handler method.
 * @property {function} handlePermissionsChange - Permission object change
 * handler.
 * @property {function} handlePermissionsCheckAll - Handle permissions column check all.
 * @property {function} onSubmit - Handler on form submission.
 */
UserGroupDialog.propTypes = {
  userGroups: PropTypes.array,
  open: PropTypes.bool,
  tempUserGroupPermissions: PropTypes.object,
  tempUserGroupName: PropTypes.string,
  schema: PropTypes.object,
  onClose: PropTypes.func,
  handleChange: PropTypes.func,
  handlePermissionsChange: PropTypes.func,
  handlePermissionsCheckAll: PropTypes.func,
  onSubmit: PropTypes.func,
};

UserGroupDialog.defaultProps = {
  userGroups: [],
  open: false,
  tempUserGroupPermissions: {},
  tempUserGroupName: '',
  onClose: null,
  schema: null,
  handleChange: null,
  handlePermissionsChange: null,
  handlePermissionsCheckAll: null,
  onSubmit: null,
};

export default UserGroupDialog;
