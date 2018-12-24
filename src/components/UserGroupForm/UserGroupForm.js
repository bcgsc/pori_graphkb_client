import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './UserGroupForm.scss';
import {
  Paper,
  Typography,
  IconButton,
  Button,
  TextField,
  FormControl,
  FormHelperText,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import PermissionsTable from '../PermissionsTable';
import DeleteRecordDialog from '../DeleteRecordDialog';
import UserGroupDialog from './UserGroupDialog/UserGroupDialog';

/**
 * Handles AdminView UserGroup form state.
 */
class UserGroupForm extends Component {
  static castPermissions(permissions) {
    const tempPermissions = {};
    const reducer = (accumulator, curr, i) => accumulator + curr * (2 ** i);
    Object.keys(permissions)
      .filter(pKey => pKey !== '@type' && pKey !== '@class')
      .forEach((pKey) => {
        tempPermissions[pKey] = permissions[pKey].reduce(reducer);
      });
    return tempPermissions;
  }

  constructor(props) {
    super(props);
    this.state = {
      tempUserGroupName: '',
      tempUserGroupPermissions: {},
      tempUserGroup: null,
      expanded: [],
      deletedUserGroup: null,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleDeleteDialog = this.handleDeleteDialog.bind(this);
    this.handleUserGroupDialog = this.handleUserGroupDialog.bind(this);
    this.handlePermissionsChange = this.handlePermissionsChange.bind(this);
    this.handlePermissionsCheckAll = this.handlePermissionsCheckAll.bind(this);
    this.handleUserGroupSubmit = this.handleUserGroupSubmit.bind(this);
    this.handleUserGroupEdit = this.handleUserGroupEdit.bind(this);
    this.handleUserGroupDelete = this.handleUserGroupDelete.bind(this);
  }


  /**
   * Sends a DELETE request to the server, then updates user group list.
   * @param {Object} userGroup - usergroup object
   */
  async handleUserGroupDelete(userGroup) {
    const { onDelete } = this.props;
    await onDelete(userGroup['@rid'].slice(1));
    this.setState({ deletedUserGroup: null });
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

  /**
   * Stages a UserGroup for editing by shallow copying it to the temp UserGroup
   * model.
   * @param {Object} userGroup - UserGroup to be staged for editing.
   */
  handlePermissionsEdit(userGroup) {
    const permissions = Object.assign({}, userGroup.permissions);
    Object.keys(permissions).forEach((key) => { permissions[key] = permissions[key].slice(); });
    const tempUserGroup = { ...userGroup, permissions };
    this.setState({
      tempUserGroupName: userGroup.name,
      tempUserGroupPermissions: permissions,
      tempUserGroup,
    });
  }


  /**
   * Updates UserGroup permission. While being edited or being prepared for
   * posting.
   * @param {string} permissionKey - Permission property key.
   * @param {number} permission - index of permission type([D, U, R, C]).
   * @param {number} currValue - bit representing permission status.
   */
  handlePermissionsChange(permissionKey, permission, currValue) {
    const { tempUserGroupPermissions } = this.state;
    if (!tempUserGroupPermissions) return;
    tempUserGroupPermissions[permissionKey][permission] = currValue ? 0 : 1;
    this.setState({ tempUserGroupPermissions });
  }

  /**
   * Checks/unchecks one column of UserGroup permissions.
   * @param {Event} event - user input checkbox event.
   * @param {number} index - Column index ([D, U, R, C]).
   */
  handlePermissionsCheckAll(event, index) {
    const { tempUserGroupPermissions } = this.state;
    const { schema } = this.props;
    Object.keys(tempUserGroupPermissions).forEach((pKey) => {
      const { isEdge, isAbstract } = schema.get(pKey);
      tempUserGroupPermissions[pKey][index] = (event.target.checked
        && !(isEdge && index === 1))
        && !(isAbstract && index !== 2)
        ? 1 : 0;
    });
    this.setState({ tempUserGroupPermissions });
  }

  /**
   * Validates form and submits PATCH request to server.
   */
  async handleUserGroupEdit() {
    const { onEdit } = this.props;
    const {
      tempUserGroupPermissions,
      tempUserGroupName,
      tempUserGroup,
    } = this.state;

    if (!tempUserGroupName) {
      return;
    }

    const tempPermissions = UserGroupForm.castPermissions(tempUserGroupPermissions);
    const payload = { name: tempUserGroupName, permissions: tempPermissions };
    const { '@rid': rid } = tempUserGroup;
    await onEdit(rid.slice(1), payload);
    this.setState({
      tempUserGroup: null,
      tempUserGroupName: '',
      tempUserGroupPermissions: null,
    });
  }

  /**
   * Validates form and calls onAdd props function with usergroup name and
   * permissions as payload.
   */
  async handleUserGroupSubmit() {
    const { onAdd, userGroups } = this.props;
    const {
      tempUserGroupPermissions,
      tempUserGroupName,
    } = this.state;

    if (
      (userGroups
        .find(u => u.name.toLowerCase() === tempUserGroupName.toLowerCase())
        || !tempUserGroupName)
    ) {
      return;
    }

    const tempPermissions = UserGroupForm.castPermissions(tempUserGroupPermissions);
    const payload = { name: tempUserGroupName, permissions: tempPermissions };

    await onAdd(payload);

    this.setState({
      tempUserGroup: null,
      tempUserGroupName: '',
      tempUserGroupPermissions: null,
      newUserGroupDialog: false,
    });
  }

  /**
   * Stages usergroup to be deleted and opens usergroup deletion dialog.
   * @param {Object} userGroup - usergroup to be staged for deletion.
   */
  handleDeleteDialog(userGroup) {
    const { deletedUserGroup } = this.state;
    this.setState({ deletedUserGroup: deletedUserGroup ? null : userGroup });
  }

  /**
   * Toggles new UserGroup dialog between open and closed. Initializes temp
   * usergroup permissions on open.
   */
  handleUserGroupDialog() {
    const { schema } = this.props;
    const { newUserGroupDialog, tempUserGroupPermissions } = this.state;
    if (newUserGroupDialog) {
      this.setState({ newUserGroupDialog: false });
    } else {
      Object.keys(schema.schema)
        .forEach((obj) => { tempUserGroupPermissions[obj] = [0, 0, 0, 0]; });
      this.setState({
        newUserGroupDialog: !newUserGroupDialog,
        tempUserGroupPermissions,
        tempUserGroupName: '',
        tempUserGroup: null,
      });
    }
  }

  /**
   * Updates state based on a user input event.
   * @param {Event} event - User input event.
   */
  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  render() {
    const {
      userGroups,
      schema,
    } = this.props;
    const {
      tempUserGroupName,
      tempUserGroupPermissions,
      tempUserGroup,
      expanded,
      deletedUserGroup,
      newUserGroupDialog,
    } = this.state;

    return (
      <Paper className="admin-user-groups">
        <DeleteRecordDialog
          open={!!deletedUserGroup}
          onClose={this.handleDeleteDialog}
          onDelete={() => this.handleUserGroupDelete(deletedUserGroup)}
          message={`Delete User Group "${(deletedUserGroup || '').name}"?`}
        />
        <UserGroupDialog
          userGroups={userGroups}
          open={newUserGroupDialog}
          tempUserGroupPermissions={tempUserGroupPermissions}
          tempUserGroupName={tempUserGroupName}
          onClose={this.handleUserGroupDialog}
          schema={schema}
          handleChange={this.handleChange}
          handlePermissionsChange={this.handlePermissionsChange}
          handlePermissionsCheckAll={this.handlePermissionsCheckAll}
          onSubmit={this.handleUserGroupSubmit}
        />
        <div className="admin-section-heading">
          <Typography component="h2" variant="h6">User Groups</Typography>
          <div className="admin-section-heading-btns">
            <IconButton onClick={this.handleUserGroupDialog}>
              <AddIcon />
            </IconButton>
          </div>
        </div>
        {userGroups.map((u) => {
          let userGroup = u;
          const isEditing = !!(tempUserGroup && userGroup['@rid'] === tempUserGroup['@rid']);
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
                              onClick={this.handleUserGroupEdit}
                              size="small"
                              variant="outlined"
                              id="edit-btn"
                            >
                              Confirm
                            </Button>
                            <Button
                              onClick={() => this.handleChange({ target: { name: 'tempUserGroup', value: null } })}
                              size="small"
                              variant="outlined"
                              id="cancel-btn"
                            >
                              Cancel
                            </Button>
                            <FormControl
                              error={(isTaken && !isSelected)}
                            >
                              <TextField
                                name="tempUserGroupName"
                                value={tempUserGroupName}
                                onChange={this.handleChange}
                                label="Name"
                                placeholder="Enter Group Name"
                                style={{ marginRight: 'auto' }}
                                error={(isTaken && !isSelected)}
                              />
                              {((isTaken && !isSelected))
                                && <FormHelperText>UserGroup name already exists</FormHelperText>
                              }
                            </FormControl>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <IconButton onClick={() => this.handlePermissionsEdit(userGroup)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => this.handleDeleteDialog(userGroup)}>
                              <DeleteIcon />
                            </IconButton>
                            <Typography component="h3" variant="subtitle1">Permissions</Typography>
                          </React.Fragment>
                        )}
                    </div>
                    <PermissionsTable
                      permissions={isEditing ? tempUserGroupPermissions : userGroup.permissions}
                      stateKey="tempUserGroup"
                      disabled={!isEditing}
                      schema={schema}
                      handleChange={this.handlePermissionsChange}
                      handleCheckAll={this.handlePermissionsCheckAll}
                    />
                  </ExpansionPanelDetails>
                ) : null}
            </ExpansionPanel>
          );
        })}
      </Paper>
    );
  }
}

/**
 * @namespace
 * @property {Array} userGroups - list of usergroup records from server.
 * @property {Object} schema - Knowledgebase schema object.
 */
UserGroupForm.propTypes = {
  userGroups: PropTypes.array,
  schema: PropTypes.object,
};

UserGroupForm.defaultProps = {
  userGroups: [],
  schema: null,
};

export default UserGroupForm;
