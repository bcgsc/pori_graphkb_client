import './index.scss';

import {
  Dialog,
  DialogContent,
} from '@material-ui/core';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TreeItem from '@material-ui/lab/TreeItem';
import TreeView from '@material-ui/lab/TreeView';
import React, { useCallback, useEffect, useState } from 'react';

import useGrid from '@/components/hooks/useGrid';

interface ColumnConfigurationProps {
  gridRef?: ReturnType<typeof useGrid>['ref'];
  isOpen?: boolean;
  onClose?: (...args: unknown[]) => void;
}

/**
 * shows list of checkboxes where each checkbox is a column.
 * if column is part of a group, it is shown with a collapsable section
 *
 * columns that are currently visible will already be checked, and clicking a checkbox will swap the visibility of that column.
 * labels for the columns/groups should match those visible in the grid
 */
const ColumnConfiguration = ({
  onClose,
  isOpen,
  gridRef,
}: ColumnConfigurationProps) => {
  const [columns, setColumns] = useState([]);
  const [openCols, setOpenCols] = useState({});

  useEffect(() => {
    const columnApi = gridRef?.current?.columnApi;

    if (!isOpen || !columnApi) { return; }

    const cols = [];
    let current;
    const nextOpenCols = {};
    columnApi.getAllColumns().forEach((column) => {
      if (column.colId.endsWith('.preview')) { return; }
      nextOpenCols[column.colId] = column.visible;
      const parent = column.originalParent;
      const parentTitle = parent ? parent.colGroupDef?.headerName : '';

      if (parentTitle && current?.id !== parent?.groupId) {
        //  add group
        current = {
          title: parentTitle,
          id: parent.groupId,
          children: [],
        };
        cols.push(current);
      }

      if (parentTitle) {
        // add to current group
        current.children.push({
          title: columnApi.getDisplayNameForColumn(column),
          id: column.colId,
          parentId: parent?.groupId,
        });
      } else {
        current = null;
        cols.push({
          title: columnApi.getDisplayNameForColumn(column),
          id: column.colId,
          parentId: parent?.groupId,
        });
      }
    });

    setOpenCols(nextOpenCols);
    setColumns(cols);
  }, [gridRef, isOpen]);

  const handleToggleColumn = useCallback((colId, show) => {
    setOpenCols((prev) => ({ ...prev, [colId]: show }));
    const columnApi = gridRef?.current?.columnApi;

    if (columnApi) {
      columnApi.setColumnVisible(colId, show);
    }
  }, [gridRef]);

  const result = (
    <Dialog
      className="column-configuration"
      onClose={onClose}
      open={isOpen}
    >
      <DialogContent className="column-configuration__content">
        <TreeView>
          {columns.map((column) => {
            if (column.children) {
              // column group
              return (
                <TreeItem
                  key={column.id}
                  className="column-configuration__item"
                  collapseIcon={<ExpandMoreIcon />}
                  expandIcon={<ChevronRightIcon />}
                  label={column.title}
                  nodeId={column.id}
                >
                  {column.children.map((child) => (
                    <TreeItem
                      key={child.id}
                      className="column-configuration__item"
                      icon={openCols[child.id]
                        ? (<CheckBoxIcon color="secondary" />)
                        : (<CheckBoxOutlineBlankIcon />)}
                      label={child.title}
                      nodeId={child.id}
                      onIconClick={() => handleToggleColumn(child.id, !openCols[child.id])}
                      onLabelClick={() => handleToggleColumn(child.id, !openCols[child.id])}
                    />
                  ))}
                </TreeItem>
              );
            }

            return (
              <TreeItem
                key={column.id}
                className="column-configuration__item"
                icon={openCols[column.id]
                  ? (<CheckBoxIcon color="secondary" />)
                  : (<CheckBoxOutlineBlankIcon />)}
                label={column.title}
                nodeId={column.id}
                onIconClick={() => handleToggleColumn(column.id, !openCols[column.id])}
                onLabelClick={() => handleToggleColumn(column.id, !openCols[column.id])}
              />
            );
          })}
        </TreeView>
      </DialogContent>
    </Dialog>
  );
  return result;
};

ColumnConfiguration.defaultProps = {
  onClose: () => {},
  isOpen: false,
};

export default ColumnConfiguration;
