/**
 * @module /components/PermissionsTable
 */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
} from '@material-ui/core';

import kbSchema from '@bcgsc/knowledgebase-schema';

import { KBContext } from '../../../KBContext';
import './index.scss';

const { constants: { PERMISSIONS } } = kbSchema;

/* eslint-disable no-bitwise */

/**
 * Table to display permissions state for a certain user group.
 * @property {Object} props - Component props.
 * @property {bool} props.disabled flag to indicate this field cannot be edited
 * @property {func} props.onValueChange handler to propogate changes to the parent form
 * @property {string} props.name field name to use in simulating events
 * @property {object} props.value the current permissions set
 */
class PermissionsTable extends React.Component {
  static contextType = KBContext;

  static propTypes = {
    value: PropTypes.object,
    disabled: PropTypes.bool,
    onValueChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
  };

  static defaultProps = {
    value: {},
    disabled: false,
  };

  constructor(props) {
    super(props);
    const { value } = this.props;
    this.state = {
      content: value,
      topBoxes: {},
    };
  }

  componentDidUpdate(prevProps) {
    const { value } = this.props;
    if (JSON.stringify(prevProps.value) !== JSON.stringify(value)) {
      this.setState({ content: value });
    }
  }

  /**
   * For a mapping of class names to the single permissions value, split these by operation types
   * for display as checkboxes
   */
  splitPermissionsByOperation(permissions) {
    const { schema } = this.context;
    const permByModelName = {};

    if (!schema) {
      return {};
    }
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
  }

  /**
   * Handle the user clicking a checkbox to either clear or check it
   * when the modelName is not given and is null, assumes a checkAll event
   */
  handleClick(operation, currModelName = null) {
    const { onValueChange, name } = this.props;
    const { content, topBoxes } = this.state;
    const { schema } = this.context;

    const newContent = Object.assign({}, content);
    const newTopBoxes = Object.assign({}, topBoxes);
    if (!currModelName) {
      newTopBoxes[operation] = !newTopBoxes[operation];
    }

    for (const modelName of Object.keys(content)) { // eslint-disable-line no-restricted-syntax
      if (!schema.has(modelName) || content[modelName] === null) {
        continue;
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
    this.setState({ content: newContent, topBoxes: newTopBoxes });
    onValueChange({ target: { name, value: newContent } });
  }

  render() {
    const {
      disabled,
    } = this.props;
    const { content, topBoxes } = this.state;

    const operationOrder = ['CREATE', 'READ', 'UPDATE', 'DELETE'];
    const permByModelName = this.splitPermissionsByOperation(content || {});
    const modelOrder = Object.keys(permByModelName).sort();

    return (
      <div className="permissions-table">
        <Table>
          <TableHead>
            <TableRow className="permissions-table__header">
              <TableCell padding="dense" />
              {operationOrder.map(operation => (
                <TableCell key={operation} padding="checkbox">
                  {operation}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell padding="dense" />
              {operationOrder.map(operation => (
                <TableCell key={operation} padding="checkbox">
                  <Checkbox
                    onChange={() => this.handleClick(operation, null)}
                    checked={topBoxes[operation]}
                    disabled={disabled}
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
                    <TableCell padding="dense">
                      {modelName}:
                    </TableCell>
                    {operationOrder.map(operation => (
                      <TableCell padding="checkbox" key={operation}>
                        {(permission[operation] !== null && (
                          <Checkbox
                            onChange={() => this.handleClick(operation, modelName)}
                            checked={permission[operation] !== 0}
                            disabled={disabled}
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
  }
}

export default PermissionsTable;
