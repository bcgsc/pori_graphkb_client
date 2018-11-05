import React from 'react';
import PropTypes from 'prop-types';
import './PermissionsTable.css';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Typography,
} from '@material-ui/core';
import config from '../../static/config.json';

const { PERMISSIONS } = config;
const KEY_MAPPER = 'CRUD';
/**
 * Table to display permissions state for a certain user group.
 * @param {Object} props - Component props.
 */
function PermissionsTable(props) {
  const {
    userGroup,
    disabled,
    stateKey,
    schema,
    handleCheckAll,
    handleChange,
  } = props;
  const { permissions } = (userGroup || {});
  const permissionKeys = Object.keys(permissions || {})
    .sort((a, b) => a > b ? 1 : -1);

  const list = (
    <Table className="alternating-table">
      <TableHead>
        <TableRow id="sticky-row">
          <TableCell padding="dense" />
          {PERMISSIONS.map(permission => (
            <TableCell key={permission} padding="checkbox">
              {`${permission.charAt(0)}${permission.slice(1).toLowerCase()}`}
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell padding="dense" />
          {PERMISSIONS.map((p, i) => (
            <TableCell key={p} padding="checkbox">
              <Checkbox
                onChange={e => handleCheckAll(e, i, stateKey)}
                disabled={disabled}
              />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {permissionKeys
          .map((permission) => {
            const isEdge = schema.isEdge(permission);
            const isAbstract = schema.isAbstract(permission);
            return (
              <TableRow key={permission} className="permissions-view">
                <TableCell padding="dense">
                  <Typography variant="body1" component="p">
                    {permission}:
                  </Typography>
                </TableCell>
                {userGroup.permissions[permission].map((p, j) => (
                  <TableCell padding="checkbox" key={`${userGroup.name}${permission}${KEY_MAPPER[j]}`}>
                    {(
                      !(isEdge && j === 1)
                      && !(isAbstract && j !== 2)
                    )
                      && (
                        <Checkbox
                          onChange={() => handleChange(
                            permission,
                            j, p,
                            stateKey,
                          )}
                          checked={!!p}
                          disabled={disabled}
                        />)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
  return (
    <div className="user-group-grid">
      {list}
    </div>
  );
}

/**
 * @namespace
 * @property {Object} userGroup - Input usergroup object.
 * @property {boolean} disabled - If true, all table inputs are disabled.
 * @property {string} stateKey - Parent component state key for userobject.
 * @property {Object} schema - Knowledgebase db schema.
 * @property {function} handleCheckAll - Handler for when all checkbox is changed.
 * @property {function} handleChange - Handler for when single checkbox is changed.
 */
PermissionsTable.propTypes = {
  userGroup: PropTypes.object,
  disabled: PropTypes.bool,
  stateKey: PropTypes.string,
  schema: PropTypes.object,
  handleCheckAll: PropTypes.func,
  handleChange: PropTypes.func,
};

PermissionsTable.defaultProps = {
  userGroup: null,
  disabled: false,
  stateKey: '',
  schema: null,
  handleCheckAll: null,
  handleChange: null,
};

export default PermissionsTable;
