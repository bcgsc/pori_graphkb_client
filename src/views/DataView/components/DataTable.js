import React from 'react';
import {
  FormControlLabel, Checkbox, Popover, Avatar,
} from '@material-ui/core';
import { AgGridReact } from 'ag-grid-react';
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';
import LinkIcon from '@material-ui/icons/Link';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import { KBContext } from '../../../components/KBContext';
import OptionsMenu from '../../../components/OptionsMenu';
import DetailChip from '../../../components/DetailChip';
import DataCache from '../../../services/api/dataCache';
import { SelectionTracker } from './SelectionTracker';

const MAX_FULL_EXPORTS_ROWS = 1000;
const CACHE_BLOCK_SIZE = 50;

class DataTable extends React.Component {
  static contextType = KBContext;

  static propTypes = {
    search: PropTypes.string,
    rowBuffer: PropTypes.number,
    cache: PropTypes.instanceOf(DataCache).isRequired,
    onRecordClicked: PropTypes.func,
    onRecordsSelected: PropTypes.func,
    onRowSelected: PropTypes.func.isRequired,
    optionsMenuAnchor: PropTypes.object.isRequired,
    optionsMenuOnClose: PropTypes.func.isRequired,
    isExportingData: PropTypes.func.isRequired,
  };

  static defaultProps = {
    search: '',
    rowBuffer: 200,
    onRecordClicked: null,
    onRecordsSelected: null,
  };

  constructor(props) {
    super(props);
    this.api = null;
    this.columnApi = null;
    this.state = {
      // active columns
      allColumns: [],
      activeColumns: new Set(),
      allGroups: {},
      activeGroups: new Set(),
      pingedIndices: new Set(),
      totalNumOfRows: null,
      selectionTracker: new SelectionTracker(),
      prevNodeID: null,
    };
  }

  componentDidUpdate(prevProps) {
    const { search } = this.props;

    if (this.gridApi && search !== prevProps.search) {
      this.initializeGrid();
    }
  }

  componentWillUnmount() {
    this.gridApi.removeEventListener('rowClicked', this.handleSelectionChange);
  }

  @boundMethod
  onGridReady({ api: gridApi, columnApi }) {
    this.gridApi = gridApi;
    this.gridColumnApi = columnApi;

    this.gridApi.addEventListener('rowClicked', this.handleSelectionChange);

    this.initializeGrid();
  }

  async getTableData({
    startRow,
    endRow, // exclusive
    sortModel,
  }) {
    const { search, cache } = this.props;

    const result = await cache.getRows({
      startRow, endRow, search, sortModel,
    });
    this.setState({ pingedIndices: new Set() });
    return [result, cache.rowCount(search)];
  }

  selectNodeRowsInTable = (gridApi, selectionTracker) => {
    const selectedRecords = selectionTracker.rangeList;
    const { length } = selectedRecords;
    gridApi.forEachNode((node) => {
      const currNodeID = parseInt(node.id, 10);
      for (let i = 0; i < length; i++) {
        const currRange = selectedRecords[i];
        if (currNodeID >= currRange.minVal && currNodeID <= currRange.maxVal) {
          node.setSelected(true);
        }
      }
    });
  };

  /**
   * Selects all nodes that are in the current selection tracking on the
   * current displayed cache page.
   */
  selectFetchedRowNodes = async (gridApi, selectionTracker) => {
    const selectedRecords = selectionTracker.rangeList;
    gridApi.forEachNode((node) => {
      const currNodeID = parseInt(node.id, 10);
      for (let i = 0; i < selectedRecords.length; i++) {
        const currRange = selectedRecords[i];
        if (currNodeID >= currRange.minVal && currNodeID <= currRange.maxVal) {
          node.setSelected(true);
        }
      }
    });
  };

  detectColumns() {
    const activeColumns = this.gridColumnApi.getAllDisplayedColumns()
      .map(col => col.colId);
    const allColumns = [];
    const allGroups = {};
    const activeGroups = this.gridColumnApi.getAllDisplayedColumnGroups()
      .map(col => col.colId);

    this.gridColumnApi.columnController.columnDefs.forEach((col) => {
      if (col.groupId) {
        allGroups[col.groupId] = col.children.map(childCol => childCol.colId);
      }
      allColumns.push(col.colId || col.groupId);
    });
    this.setState({
      allColumns, activeColumns: new Set(activeColumns), allGroups, activeGroups: new Set(activeGroups),
    });
  }

  openColumnGroup(groupId, open = true) {
    const columnGroupState = this.gridColumnApi.getColumnGroupState();

    for (let i = 0; i < columnGroupState.length; i++) {
      if (columnGroupState[i].groupId === groupId) {
        columnGroupState[i] = { ...columnGroupState[i], open };
        break;
      }
    }
    this.gridColumnApi.setColumnGroupState(columnGroupState);
  }

  handleToggleGroup(groupId) {
    const { allGroups, activeGroups, activeColumns } = this.state;
    const isActive = activeGroups.has(groupId);
    const newActiveGroups = new Set(activeGroups);
    const newActiveColumns = new Set(activeColumns);

    const closedColumnName = `${groupId}.preview`;
    this.openColumnGroup(groupId, false); // close the group

    // remove all the other columns from the active columns
    allGroups[groupId].forEach((colId) => {
      newActiveColumns.delete(colId);
      this.gridColumnApi.setColumnVisible(colId, false);
    });

    if (isActive) {
      // hiding the group
      newActiveGroups.delete(groupId);
      this.gridColumnApi.setColumnVisible(closedColumnName, false);
    } else {
      // display the group as closed
      newActiveGroups.add(groupId);
      this.gridColumnApi.setColumnVisible(closedColumnName, true);
    }

    this.setState({ activeGroups: newActiveGroups, activeColumns: newActiveColumns });
  }

  handleToggleColumn(colId, groupId = null) {
    const { activeColumns, activeGroups } = this.state;
    const isActive = activeColumns.has(colId);
    this.gridColumnApi.setColumnVisible(colId, !isActive);

    const newActiveColumns = new Set(activeColumns);
    const newActiveGroups = new Set(activeGroups);
    if (isActive) {
      newActiveColumns.delete(colId);
    } else {
      newActiveColumns.add(colId);
      // if a group Id is given, toggle the group open
      if (groupId) {
        this.openColumnGroup(groupId, true);
      }
    }
    this.setState({ activeColumns: newActiveColumns, activeGroups: newActiveGroups });
  }

  @boundMethod
  async handleExportTsv(selectionOnly = false) {
    const { schema, auth } = this.context;
    const { totalNumOfRows, selectionTracker } = this.state;
    const { isExportingData } = this.props;
    isExportingData(true);

    const { gridOptions } = this.gridApi.getModel().gridOptionsWrapper;
    const header = `## Exported from GraphKB at ${new Date()} by ${auth.username}
## Distribution and Re-use of the contents of GraphKB are subject to the usage aggreements of individual data sources.
## Please review the appropriate agreements prior to use (see usage under sources)`;

    const formatValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        return schema.getLabel(value, false);
      }
      return value === undefined
        ? null
        : value;
    };

    const exportParams = {
      columnGroups: true,
      fileName: `graphkb_export_${(new Date()).valueOf()}.tsv`,
      columnSeparator: '\t',
      suppressQuotes: true,
      customHeader: header,
      onlySelected: selectionOnly,
      onlySelectedAllPages: selectionOnly,
      processCellCallback: ({ value }) => {
        if (Array.isArray(value)) {
          return value.map(formatValue).join(';');
        }
        return formatValue(value);
      },
    };

    if (!selectionOnly) {
      gridOptions.cacheBlockSize = totalNumOfRows; // in preparation to fetch entire dataset

      const tempDataSource = {
        rowCount: null,
        getRows: async ({
          successCallback, failCallback, ...params
        }) => {
          params.endRow = totalNumOfRows; // fetches entire data set with this adjustment
          try {
            const [rows, lastRow] = await this.getTableData(params);
            successCallback(rows, lastRow);
            await this.gridApi.exportDataAsCsv(exportParams);
            await this.resetDefaultGridOptions();
            isExportingData(false);
          } catch (err) {
            console.error(err);
            failCallback();
          }
        },
      };

      this.gridApi.setDatasource(tempDataSource);
    } else {
      const lastIndex = selectionTracker.rangeList.length - 1;
      const maxSelectedRow = selectionTracker.rangeList[lastIndex].maxVal;
      gridOptions.cacheBlockSize = maxSelectedRow; // in preparation to fetch entire dataset

      const tempDataSource = {
        rowCount: null,
        getRows: async ({
          successCallback, failCallback, ...params
        }) => {
          params.endRow = maxSelectedRow; // fetches entire data set with this adjustment
          try {
            const [rows, lastRow] = await this.getTableData(params);
            successCallback(rows, lastRow);
            await this.selectFetchedRowNodes(this.gridApi, selectionTracker);
            await this.gridApi.exportDataAsCsv(exportParams);
            await this.resetDefaultGridOptions();
            isExportingData(false);
          } catch (err) {
            console.error(err);
            failCallback();
          }
        },
      };

      this.gridApi.setDatasource(tempDataSource);
    }
  }

  @boundMethod
  resizeColumnsTofitEdges({ type, newPage }) {
    if (this.gridColumnApi) {
      if (type === 'paginationChanged' && newPage !== undefined) {
        this.gridColumnApi.autoSizeColumns(['ImpliedBy', 'SupportedBy', 'Implies', 'preview']);
      }
    }
  }

  @boundMethod
  detectFetchTrigger({ top, direction }) {
    const { pingedIndices } = this.state;
    const { rowBuffer, search, cache } = this.props;

    if (this.gridApi && cache && direction === 'vertical') {
      const { rowModel: { rowHeight } } = this.gridApi;
      const lastRow = this.gridApi.getLastDisplayedRow();
      const pingedKey = `${search}-${lastRow}`;

      if (!pingedIndices.has(pingedKey)) {
        const currentRowIndex = Math.round(top / rowHeight);

        if (lastRow - currentRowIndex < rowBuffer) {
          cache.getRows({
            search, startRow: lastRow + 1, endRow: lastRow + rowBuffer, sortModel: this.gridApi.getSortModel(),
          });
          const newPings = new Set(pingedIndices);
          newPings.add(pingedKey);
          this.setState({ pingedIndices: newPings });
        }
      }
    }
  }

  /**
   * Handles selection of records in DataTable. Maintains selectionTracker which is an array
   * of Selection Ranges to represent the selected Rows. Ex. if rows 0-20 and 30-34 are selected,
   * selectionTracker will contain two selection ranges. selectionTracker = [SR(0, 20), SR(30, 34)]
   * This is used instead of Ag-grids default selection API to handle infinite scrolling selection
   * of rows that are not displayed.
   */
  @boundMethod
  handleSelectionChange(event) {
    const {
      event: {
        type, key, ctrlKey, shiftKey,
      },
      node: rowNode, rowIndex,
      node: { id },
    } = event;

    const nodeID = parseInt(id, 10);
    let { prevNodeID } = this.state;
    const { onRowSelected } = this.props;
    const { selectionTracker } = this.state;
    console.log('TCL: handleSelectionChange -> selectionTracker', selectionTracker.rangeList);

    let newSelectionTracker;
    if (type === 'click') {
      // 1. first time selecting a row OR just a regular ole click
      if (prevNodeID === null || (!ctrlKey && !shiftKey)) {
        newSelectionTracker = new SelectionTracker(nodeID, nodeID);
      } else if (shiftKey) {
      // 2. shift key extends a the previously selected range or resets selection range
        const isCurrNodeInSelection = selectionTracker.isNodeAlreadySelected(nodeID);
        if (isCurrNodeInSelection) {
          newSelectionTracker = new SelectionTracker(nodeID, nodeID);
        } else {
          newSelectionTracker = SelectionTracker.extendRangeUpdateSelection(prevNodeID, nodeID, selectionTracker);
        }
      } else if (ctrlKey) {
      // 3. ctrl key adds a new Range to selection unless it has already been selected
        newSelectionTracker = selectionTracker.checkAndUpdate(nodeID, selectionTracker);
      }
      prevNodeID = nodeID;

      this.setState({ selectionTracker: newSelectionTracker, prevNodeID });
      console.log('TCL: handleSelectionChange -> newSelectionTracker', newSelectionTracker.rangeList);
      this.selectNodeRowsInTable(this.gridApi, newSelectionTracker);
      const totalNumOfRows = newSelectionTracker.getTotalNumOfSelectedRows();
      onRowSelected(totalNumOfRows);
    } else if (type === 'keydown') {
      if (key === 'Shift') {
        rowNode.setSelected(true);
        newSelectionTracker = selectionTracker.checkAndUpdate(nodeID, selectionTracker);
        prevNodeID = nodeID;

        this.setState({ selectionTracker: newSelectionTracker, prevNodeID });
        console.log('TCL: handleSelectionChange -> newSelectionTracker', newSelectionTracker.rangeList);
        const totalNumOfRows = newSelectionTracker.getTotalNumOfSelectedRows();
        onRowSelected(totalNumOfRows);
      } else if (shiftKey && ['ArrowDown', 'ArrowUp'].includes(key)) {
        const direction = key === 'ArrowDown'
          ? +1
          : -1;
        const nextRow = this.gridApi.getDisplayedRowAtIndex(rowIndex + direction);
        if (nextRow) {
          nextRow.setSelected(true);
        }
      }
    }
  }

  initializeGrid() {
    const { search } = this.props;
    const { schema } = this.context;

    this.gridApi.setColumnDefs([
      {
        colId: 'ID',
        field: '#',
        valueGetter: 'node.id',
        width: 75,
      },
      ...schema.defineGridColumns(search),
    ]);
    this.detectColumns();

    const dataSource = {
      rowCount: null,
      getRows: ({
        successCallback, failCallback, ...params
      }) => {
        this.getTableData(params)
          .then(([rows, lastRow]) => {
            // update filters
            this.setState({ totalNumOfRows: lastRow });
            successCallback(rows, lastRow);
          }).catch(() => failCallback());
      },
    };
    // update the model
    this.gridApi.setDatasource(dataSource);
  }


  async resetDefaultGridOptions() {
    const { gridOptions } = this.gridApi.getModel().gridOptionsWrapper;
    const dataSource = {
      rowCount: null,
      getRows: ({
        successCallback, failCallback, ...params
      }) => {
        this.getTableData(params)
          .then(([rows, lastRow]) => {
            // update filters
            successCallback(rows, lastRow);
          }).catch(() => failCallback());
      },
    };

    // update the model
    await this.gridApi.setDatasource(dataSource);
    gridOptions.cacheBlockSize = CACHE_BLOCK_SIZE;
  }

  renderOptionsMenu() {
    const {
      allColumns, activeColumns, allGroups, activeGroups, totalNumOfRows, selectionTracker,
    } = this.state;
    const { optionsMenuAnchor, optionsMenuOnClose } = this.props;
    const ignorePreviewColumns = colId => !colId.endsWith('.preview');

    const selectionCount = selectionTracker.getTotalNumOfSelectedRows();
    const ColumnCheckBox = (colId, groupId = null) => (
      <FormControlLabel
        key={colId}
        control={(
          <Checkbox
            checked={activeColumns.has(colId)}
            onChange={() => this.handleToggleColumn(colId, groupId)}
          />
        )}
        label={this.gridColumnApi.getColumn(colId).colDef.field}
      />
    );

    const columnControl = allColumns.sort().map((colId) => {
      if (allGroups[colId]) {
        return (
          <fieldset key={colId}>
            <caption>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={activeGroups.has(colId)}
                    onChange={() => this.handleToggleGroup(colId)}
                  />
              )}
                label={colId}
              />
            </caption>
            {allGroups[colId].filter(ignorePreviewColumns).map(subColId => ColumnCheckBox(subColId, colId))}
          </fieldset>
        );
      }
      return ColumnCheckBox(colId);
    });

    const menuContents = [
      {
        label: 'Configure Visible Columns',
        content: columnControl,
      },
    ];

    if (totalNumOfRows < MAX_FULL_EXPORTS_ROWS) {
      menuContents.push({
        label: 'Export All to TSV',
        handler: () => this.handleExportTsv(false),
      });
    }

    if (selectionCount) {
      menuContents.push({
        label: `Export Selected Rows (${selectionCount}) to TSV`,
        handler: () => this.handleExportTsv(true),
      });
    }

    const result = (
      <Popover
        open={optionsMenuAnchor !== null}
        anchorEl={optionsMenuAnchor}
        onClose={optionsMenuOnClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <OptionsMenu
          className="data-view__options-menu"
          options={menuContents}
        />
      </Popover>
    );
    return result;
  }

  render() {
    const { schema } = this.context;
    const { onRecordClicked, onRecordsSelected } = this.props;

    const RecordList = (props) => {
      const { value: records } = props;

      if (!records) {
        return null;
      }
      return (
        <div className="data-table__record-list">
          {records.map((record) => {
            const label = schema.getLabel(record);
            return (
              <DetailChip
                label={label}
                title={schema.getLabel(record, false)}
                key={label}
                details={record}
                valueToString={(v) => {
                  if (Array.isArray(v)) {
                    return `Array(${v.length})`;
                  }
                  if (v && typeof v === 'object' && v['@rid']) {
                    return schema.getLabel(v, false);
                  }
                  return `${v}`;
                }}

                getLink={schema.getLink}
                ChipProps={{
                  avatar: (<Avatar><LinkIcon /></Avatar>),
                  variant: 'outlined',
                  color: 'primary',
                }}
              />
            );
          })}
        </div>
      );
    };

    const DefaultRender = ({ value, data }) => {
      if (data === undefined) {
        return null;
      } if (typeof value === 'object' && value !== null) {
        return schema.getLabel(value, false);
      }
      return value === undefined
        ? null
        : value;
    };

    return (
      <div
        className="ag-theme-material data-table"
        style={{
          width: '100%',
          height: '100%',
        }}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        role="presentation"
      >
        {this.renderOptionsMenu()}
        <AgGridReact
          defaultColDef={{
            sortable: true,
            resizable: true,
            width: 150,
            cellRenderer: 'DefaultRender',
          }}
          infiniteInitialRowCount={1}
          maxBlocksInCache={0}
          maxConcurrentDatasourceRequests={1}
          onGridReady={this.onGridReady}
          cacheBlockSize={CACHE_BLOCK_SIZE}
          // pagination
          // paginationAutoPageSize
          paginationPageSize={25}
          cacheOverflowSize={1}
          rowModelType="infinite"
          suppressHorizontalScroll={false}
          frameworkComponents={{
            RecordList,
            DefaultRender,
          }}
          blockLoadDebounceMillis={100}
          onPaginationChanged={this.resizeColumnsTofitEdges}
          onBodyScroll={this.detectFetchTrigger}
          onCellFocused={({ rowIndex }) => {
            if (rowIndex !== null && onRecordClicked) {
              const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
              onRecordClicked(rowNode);
            }
          }}
          // allow the user to select using the arrow keys and shift
          onCellKeyDown={this.handleSelectionChange}
          onSelectionChanged={() => {
            if (onRecordsSelected) {
              const rows = this.gridApi.getSelectedRows();
              onRecordsSelected(rows);
            }
          }}
          rowSelection="multiple"
        />
      </div>
    );
  }
}

export default DataTable;
