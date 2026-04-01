import './index.scss';

import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Dialog,
  DialogContent,
} from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import React, { useCallback, useEffect, useState } from 'react';

import useGrid from '@/components/hooks/useGrid';

interface ColumnConfigurationProps {
  gridRef?: ReturnType<typeof useGrid>['ref'];
  isOpen?: boolean;
  onClose?: (...args: unknown[]) => void;
}
interface Col {
  title: string;
  id: string;
  parentId?: string;
  children?: Col[];
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
  isOpen = false,
  gridRef,
}: ColumnConfigurationProps) => {
  const [columns, setColumns] = useState<Col[]>([]);
  const [openCols, setOpenCols] = useState({});

  useEffect(() => {
    const columnApi = gridRef?.current?.columnApi;

    if (!isOpen || !columnApi) { return; }
    const cols: Col[] = [];
    let current;
    const nextOpenCols = {};
    columnApi.getAllColumns()?.forEach((column) => {
      if (column.getColId().endsWith('.preview')) { return; }
      nextOpenCols[column.getColId()] = column.isVisible();
      const parent = column.getOriginalParent();
      const parentTitle = parent ? parent.getColGroupDef()?.headerName : '';

      if (parentTitle && current?.id !== parent?.getGroupId()) {
        //  add group
        current = {
          title: parentTitle,
          id: parent!.getGroupId(),
          children: [],
        };
        cols.push(current);
      }

      if (parentTitle) {
        // add to current group
        current.children.push({
          title: columnApi.getDisplayNameForColumn(column, null),
          id: column.getColId(),
          parentId: parent?.getGroupId(),
        });
      } else {
        current = null;
        cols.push({
          title: columnApi.getDisplayNameForColumn(column, null),
          id: column.getColId(),
          parentId: parent?.getGroupId(),
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
        <SimpleTreeView
          onItemExpansionToggle={(_, childId, isExpanded) => {
            handleToggleColumn(childId, isExpanded);
          }}
          slots={{
            collapseIcon: ExpandMoreIcon,
            expandIcon: ChevronRightIcon,
          }}
        >
          {columns.map((column) => {
            if (column.children) {
              // column group
              return (
                <TreeItem
                  key={column.id}
                  className="column-configuration__item"
                  itemId={column.id}
                  label={column.title}
                >
                  {column.children.map((child) => (
                    <TreeItem
                      key={child.id}
                      className="column-configuration__item"
                      itemId={child.id}
                      label={child.title}
                      slots={{
                        icon: openCols[child.id]
                          ? (() => <CheckBoxIcon color="secondary" />)
                          : CheckBoxOutlineBlankIcon,
                      }}
                    />
                  ))}
                </TreeItem>
              );
            }

            return (
              <TreeItem
                key={column.id}
                className="column-configuration__item"
                itemId={column.id}
                label={column.title}
                slots={{
                  icon: openCols[column.id]
                    ? (() => <CheckBoxIcon color="secondary" />)
                    : CheckBoxOutlineBlankIcon,
                }}
              />
            );
          })}
        </SimpleTreeView>
      </DialogContent>
    </Dialog>
  );
  return result;
};

export default ColumnConfiguration;
