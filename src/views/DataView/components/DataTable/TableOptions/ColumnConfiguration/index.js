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
import { titleCase } from 'change-case';
import PropTypes from 'prop-types';
import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';

import GridContext from '../../GridContext';


const detectColumns = (gridColumnApi) => {
  const activeColumns = gridColumnApi.getAllDisplayedColumns()
    .map(col => col.colId);
  const allColumns = [];
  const allGroups = {};
  const activeGroups = gridColumnApi.getAllDisplayedColumnGroups()
    .map(col => col.colId);

  gridColumnApi.columnController.columnDefs.forEach((col) => {
    if (col.groupId) {
      allGroups[col.groupId] = col.children.map(childCol => childCol.colId);
    }
    allColumns.push(col.colId || col.groupId);
  });
  return {
    allColumns, activeColumns: new Set(activeColumns), allGroups, activeGroups: new Set(activeGroups),
  };
};


const getColumnLabel = (gridColumnApi, colId) => {
  const { colDef } = gridColumnApi.getColumn(colId);
  return colDef.headerName || titleCase(colDef.field);
};


const ColumnConfiguration = ({
  onClose,
  isOpen,
}) => {
  const { gridApi, gridReady, colApi: gridColumnApi } = useContext(GridContext);
  const [activeColumns, setActiveColumns] = useState(new Set());
  const [allColumns, setAllColumns] = useState([]);
  const [allGroups, setAllGroups] = useState({});

  const ignorePreviewColumns = colId => !colId.endsWith('.preview');

  const update = useCallback(() => {
    const state = detectColumns(gridColumnApi);
    setActiveColumns(state.activeColumns);
    setAllColumns(state.allColumns);
    setAllGroups(state.allGroups);
  }, [gridColumnApi]);

  useEffect(() => {
    if (gridReady && gridColumnApi) {
      update();
      gridApi.addEventListener('columnGroupOpened', update);
    }
  }, [gridApi, gridColumnApi, gridReady, update]);

  const openColumnGroup = useCallback((groupId, open = true) => {
    const columnGroupState = gridColumnApi.getColumnGroupState();

    for (let i = 0; i < columnGroupState.length; i++) {
      if (columnGroupState[i].groupId === groupId) {
        columnGroupState[i] = { ...columnGroupState[i], open };
        break;
      }
    }
    gridColumnApi.setColumnGroupState(columnGroupState);
  }, [gridColumnApi]);


  const handleToggleColumn = useCallback((colId, groupId = null) => {
    const isActive = activeColumns.has(colId);
    gridColumnApi.setColumnVisible(colId, !isActive);

    const newActiveColumns = new Set(activeColumns);

    if (isActive) {
      newActiveColumns.delete(colId);
    } else {
      newActiveColumns.add(colId);

      // if a group Id is given, toggle the group open
      if (groupId) {
        openColumnGroup(groupId, true);
      }
    }
    setActiveColumns(newActiveColumns);
  }, [activeColumns, gridColumnApi, openColumnGroup]);


  const ColumnCheckBox = (colId, groupId = null) => (
    <TreeItem
      key={colId}
      className="column-configuration__item"
      icon={activeColumns.has(colId)
        ? (<CheckBoxIcon color="secondary" />)
        : (<CheckBoxOutlineBlankIcon />)}
      label={getColumnLabel(gridColumnApi, colId)}
      nodeId={colId}
      onIconClick={() => handleToggleColumn(colId, groupId)}
    />
  );

  const columnControl = allColumns.sort().map((colId) => {
    if (allGroups[colId]) {
      return (
        <TreeItem
          key={colId}
          className="column-configuration__item"
          collapseIcon={<ExpandMoreIcon />}
          expandIcon={<ChevronRightIcon />}
          label={colId}
          nodeId={colId}
        >
          {allGroups[colId].filter(ignorePreviewColumns).map(subColId => ColumnCheckBox(subColId, colId))}
        </TreeItem>
      );
    }
    return ColumnCheckBox(colId);
  });


  const result = (
    <Dialog
      className="column-configuration"
      onClose={onClose}
      open={isOpen}
    >
      <DialogContent className="column-configuration__content">
        <TreeView>
          {columnControl}
        </TreeView>
      </DialogContent>
    </Dialog>
  );
  return result;
};

ColumnConfiguration.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

ColumnConfiguration.defaultProps = {
  onClose: () => {},
  isOpen: false,
};


export default ColumnConfiguration;
