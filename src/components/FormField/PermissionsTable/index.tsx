/**
 * @module /components/PermissionsTable
 */
import './index.scss';

import kbSchema from '@bcgsc-pori/graphkb-schema';
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

import schema from '@/services/schema';

const { constants: { PERMISSIONS } } = kbSchema;

/* eslint-disable no-bitwise */

/**
* For a mapping of class names to the single permissions value, split these by operation types
* for display as checkboxes
*/
const splitPermissionsByOperation = (permissions) => {
  const permByModelName = {};

  Object.keys(schema.schema).forEach((modelName) => {
    const model = schema.get(modelName);

    if (!model.embedded) {
      const value = permissions[model.name] === undefined
        ? PERMISSIONS.NONE
        : permissions[model.name];

      permByModelName[modelName] = {
        READ: value & PERMISSIONS.READ,
        CREATE: null,
        UPDATE: null,
        DELETE: null,
      };

      if (!model.isAbstract) {
        permByModelName[modelName].CREATE = value & PERMISSIONS.CREATE;
        permByModelName[modelName].DELETE = value & PERMISSIONS.DELETE;

        if (!model.isEdge) {
          permByModelName[modelName].UPDATE = value & PERMISSIONS.UPDATE;
        }
      }
    }
  });
  return permByModelName;
};

/**
 * Table to display permissions state for a certain user group.
 * @property {Object} props - Component props.
 * @property {bool} props.disabled flag to indicate this field cannot be edited
 * @property {func} props.onChange handler to propogate changes to the parent form
 * @property {string} props.name field name to use in simulating events
 * @property {object} props.value the current permissions set
 */
const PermissionsTable = ({
  value, disabled, onChange, name,
}) => {
  const [content, setContent] = useState(value || {});
  const [topBoxes, setTopboxes] = useState({});

  /**
   * Handle the user clicking a checkbox to either clear or check it
   * when the modelName is not given and is null, assumes a checkAll event
   */
  const handleClick = useCallback((operation, currModelName = null) => {
    const newContent = { ...content };
    const newTopBoxes = { ...topBoxes };

    if (!currModelName) {
      newTopBoxes[operation] = !newTopBoxes[operation];
    }

    for (const modelName of Object.keys(content)) { // eslint-disable-line no-restricted-syntax
      if (!schema.has(modelName) || content[modelName] === null) {
        continue; // eslint-disable-line no-continue
      }

      if (currModelName) {
        const checked = (content[modelName] & PERMISSIONS[operation]) !== 0;

        // update an operation for a single row
        if (modelName === currModelName) {
          if (checked) {
            newContent[modelName] &= ~PERMISSIONS[operation]; // remove permissions for this operation
          } else {
            newContent[modelName] |= PERMISSIONS[operation];
          }
        }
      } else if (!newTopBoxes[operation]) {
        // clear all
        newContent[modelName] &= ~PERMISSIONS[operation];
        topBoxes[operation] = false;
      } else {
        // check all
        topBoxes[operation] = true;
        newContent[modelName] |= PERMISSIONS[operation];
      }
    }
    setContent(newContent);
    setTopboxes(newTopBoxes);
    onChange({ target: { name, value: newContent } });
  }, [content, name, onChange, topBoxes]);

  const operationOrder = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
  const permByModelName = splitPermissionsByOperation(content || {});
  const modelOrder = Object.keys(permByModelName).sort();

  return (
    <div className="permissions-table">
      <Table>
        <TableHead>
          <TableRow className="permissions-table__header">
            <TableCell size="small" />
            {operationOrder.map((operation) => (
              <TableCell key={operation} padding="checkbox">
                {operation}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell size="small" />
            {operationOrder.map((operation) => (
              <TableCell key={operation} padding="checkbox">
                <Checkbox
                  checked={topBoxes[operation]}
                  disabled={disabled}
                  onChange={() => handleClick(operation, null)}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {modelOrder.map(
            (modelName) => {
              const permission = permByModelName[modelName];
              return (
                <TableRow key={modelName} className="permissions-table__row">
                  <TableCell size="small">
                    {modelName}:
                  </TableCell>
                  {operationOrder.map((operation) => (
                    <TableCell key={operation} padding="checkbox">
                      {(permission[operation] !== null && (
                      <Checkbox
                        checked={permission[operation] !== 0}
                        disabled={disabled}
                        onChange={() => handleClick(operation, modelName)}
                      />
                      ))}
                    </TableCell>
                  ))}
                </TableRow>
              );
            },
          )}
        </TableBody>
      </Table>
    </div>
  );
};

PermissionsTable.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  value: PropTypes.object,
};

PermissionsTable.defaultProps = {
  value: {},
  disabled: false,
};

export default PermissionsTable;
