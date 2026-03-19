import './index.scss';

import { PERMISSIONS, schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import React, { useCallback, useState } from 'react';

import { BaseFormFieldProps } from '../types';

/* eslint-disable no-bitwise */

/**
 * For a mapping of class names to the single permissions value, split these by operation types
 * for display as checkboxes
 */
const splitPermissionsByOperation = (permissions: Record<string, number>) => {
  const permByModelName: Record<string, {
    READ: number | null;
    CREATE: number | null;
    UPDATE: number | null;
    DELETE: number | null;
  }> = {};

  Object.keys(schemaDefn.models).forEach((modelName) => {
    const model = schemaDefn.get(modelName);

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
 */
const PermissionsTable = ({
  value = {}, disabled = false, readOnly, onChange, name = '',
}: BaseFormFieldProps<Record<string, number>>) => {
  const [content, setContent] = useState<Record<string, number>>(value || {});
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
      if (!schemaDefn.has(modelName) || content[modelName] === null) {
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
    onChange?.({ target: { name, value: newContent } });
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
          {!disabled && !readOnly && (
            <TableRow>
              <TableCell size="small" />
              {operationOrder.map((operation) => (
                <TableCell key={operation} padding="checkbox">
                  <Checkbox
                    checked={topBoxes[operation]}
                    onChange={() => handleClick(operation, null)}
                  />
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableHead>
        <TableBody>
          {modelOrder.map((modelName) => {
            const permission = permByModelName[modelName];
            return (
              <TableRow key={modelName} className="permissions-table__row">
                <TableCell size="small">{modelName}:</TableCell>
                {operationOrder.map((operation) => (
                  <TableCell key={operation} padding="checkbox">
                    {permission[operation] !== null && (
                      <Checkbox
                        checked={permission[operation] !== 0}
                        disabled={disabled && !readOnly}
                        onChange={() => handleClick(operation, modelName)}
                        readOnly={readOnly}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PermissionsTable;
