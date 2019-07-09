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

class SelectionRange {
  constructor(minVal, maxVal) {
    this.minVal = minVal;
    this.maxVal = maxVal;
    this.count = maxVal - minVal + 1;
  }
}

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
      selectedRecords: [],
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
    this.gridApi.removeEventListener('rowClicked', this.customSelectionHandler);
  }

  @boundMethod
  onGridReady({ api: gridApi, columnApi }) {
    this.gridApi = gridApi;
    this.gridColumnApi = columnApi;

    this.gridApi.addEventListener('rowClicked', this.customSelectionHandler);

    this.initializeGrid();
  }

  getTotalNumOfSelectedRows = (selectedRecords) => {
    let totalNumOfRows = 0;
    selectedRecords.forEach((interval) => {
      const partialSum = interval.count;
      totalNumOfRows += partialSum;
    });
    return totalNumOfRows;
  };

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

  /*
   * In selection range, if there are any adjacent selection ranges, i.e
   * [ SR(2,5), SR(5,8)] merge them => [ SR(2,8)]
   */
  mergeAdjacentIntervals = (arrayOfSelectionRanges) => {
    for (let i = 0; i < arrayOfSelectionRanges.length - 1; i++) {
      const currInterval = arrayOfSelectionRanges[i];
      if (currInterval.maxVal + 1 === arrayOfSelectionRanges[i + 1].minVal) {
        const mergedInterval = new SelectionRange(currInterval.minVal, arrayOfSelectionRanges[i + 1].maxVal);
        arrayOfSelectionRanges.splice(i, 2, mergedInterval);
        this.mergeAdjacentIntervals(arrayOfSelectionRanges);
      }
    }
    return arrayOfSelectionRanges;
  };

  isNodeAlreadySelected = (nodeID, selectedRecords) => {
    for (let i = 0; i < selectedRecords.length; i++) {
      const currInterval = selectedRecords[i];
      if (nodeID >= currInterval.minVal && nodeID <= currInterval.maxVal) {
        return true;
      }
    }
    return false;
  };

  findIntervalIndex = (nodeID, selectedRecords) => {
    for (let i = 0; i < selectedRecords.length; i++) {
      const currInterval = selectedRecords[i];
      if (nodeID >= currInterval.minVal && nodeID <= currInterval.maxVal) {
        return i;
      }
    }
    return -1;
  };

  selectNodeRowsInTable = (gridApi, selectedRecords) => {
    gridApi.forEachNode((node) => {
      const currNodeID = parseInt(node.id, 10);
      for (let i = 0; i < selectedRecords.length; i++) {
        const currInterval = selectedRecords[i];
        if (currNodeID >= currInterval.minVal && currNodeID <= currInterval.maxVal) {
          node.setSelected(true);
        }
      }
    });
  };

  /*
   * Selects all nodes that are in the current selection tracking on the
   * current displayed cache page.
   */
  selectFetchedRowNodes = async (gridApi, selectedRecords) => {
    gridApi.forEachNode((node) => {
      const currNodeID = parseInt(node.id, 10);
      for (let i = 0; i < selectedRecords.length; i++) {
        const currInterval = selectedRecords[i];
        if (currNodeID >= currInterval.minVal && currNodeID <= currInterval.maxVal) {
          node.setSelected(true);
        }
      }
    });
  };

  /*
   * Extends the selection range that your previously selected nodeRow was in.
   * Removes any redundant selection ranges that result because of the extension.
   */

  forwardExtendAndUpdateIntervals = (intervalPrevNodeIsIn, selectedRecords, newInterval) => {
    let intervalsToBeDeleted = 1;
    for (let i = intervalPrevNodeIsIn + 1; i <= selectedRecords.length - 1; i++) {
      const targetInterval = selectedRecords[i];
      if ((targetInterval.minVal >= newInterval.minVal) && (targetInterval.maxVal <= newInterval.maxVal)) {
        intervalsToBeDeleted += 1;
      }
    }

    const newSelectedRecords = selectedRecords.slice();
    newSelectedRecords.splice(intervalPrevNodeIsIn, intervalsToBeDeleted, newInterval);
    return newSelectedRecords;
  };

  backwardExtendAndUpdateIntervals = (intervalPrevNodeIsIn, selectedRecords, newInterval) => {
    let intervalsToBeDeleted = 1;
    for (let i = intervalPrevNodeIsIn; i >= 0; i--) {
      const targetInterval = selectedRecords[i];
      if ((targetInterval.minVal >= newInterval.minVal) && (targetInterval.maxVal <= newInterval.maxVal)) {
        intervalsToBeDeleted += 1;
      }
    }
    const insertPosition = (selectedRecords.length - intervalsToBeDeleted) + 1;
    const newSelectedRecords = selectedRecords.slice();
    newSelectedRecords.splice(insertPosition, intervalsToBeDeleted, newInterval);
    return newSelectedRecords;
  };

  /*
   * Inserts the new interval into the appropriate spot to keep the selected Records
   * a sorted array of Selection Ranges.
   */
  insertIntervalIntoSelection = (newInterval, selectedRecords) => {
    const newSelectedRecords = selectedRecords.slice();
    const nodeID = newInterval.minVal; // does not matter whether min or max val. min === max

    for (let i = 0; i < newSelectedRecords.length; i++) {
      const currInterval = selectedRecords[i];
      if (i === 0) {
        if (nodeID < currInterval.minVal) {
          newSelectedRecords.splice(i, 0, newInterval);
          return newSelectedRecords;
        }
        if (newSelectedRecords.length === 1) {
          if (nodeID > currInterval.maxVal) {
            newSelectedRecords.splice(1, 0, newInterval);
            return newSelectedRecords;
          }
        }
      } else if (nodeID >= selectedRecords[i - 1].maxVal && nodeID <= currInterval.minVal) {
        newSelectedRecords.splice(i, 0, newInterval);
        return newSelectedRecords;
      } else if (i === newSelectedRecords.length - 1) { // END OF ARRAY
        if (nodeID > currInterval.maxVal) {
          newSelectedRecords.splice(i + 1, 0, newInterval);
          return newSelectedRecords;
        }
      }
    }
    return newSelectedRecords;
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
  handleOnCellKeyDown({ event: { key, shiftKey }, node: rowNode, rowIndex }) {
    const { selectedRecords } = this.state;
    const { onRowSelected } = this.props;
    const nodeID = parseInt(rowNode.id, 10);

    if (key === 'Shift') {
      rowNode.setSelected(true);

      const isCurrNodeInSelection = this.isNodeAlreadySelected(nodeID, selectedRecords);
      if (isCurrNodeInSelection) {
        const prevNodeID = nodeID;
        this.setState({ prevNodeID });
      } else {
        const prevNodeID = nodeID;
        const newInterval = new SelectionRange(nodeID, nodeID);
        const newSelectedRecords = this.insertIntervalIntoSelection(newInterval, selectedRecords);
        const mergedNewSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);

        this.setState({ selectedRecords: mergedNewSelectedRecords, prevNodeID });
        const totalNumOfRows = this.getTotalNumOfSelectedRows(newSelectedRecords);
        onRowSelected(totalNumOfRows);
      }
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

  @boundMethod
  async handleExportTsv(selectionOnly = false) {
    const { schema, auth } = this.context;
    const { totalNumOfRows, selectedRecords } = this.state;
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
      const lastIndex = selectedRecords.length - 1;
      const maxSelectedRow = selectedRecords[lastIndex].maxVal;
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
            await this.selectFetchedRowNodes(this.gridApi, selectedRecords);
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

  /*
   * Handles selection of records in DataTable. Maintains selectedRecords which is an array
   * of Selection Ranges to represent the selected Rows. Ex. if rows 0-20 and 30-34 are selected,
   * selectedRecords will contain two selection ranges. selectedRecords = [SR(0, 20), SR(30, 34)]
   * This is used instead of Ag-grids default selection API to handle infinite scrolling selection
   * of rows that are not displayed.
   */

  @boundMethod
  customSelectionHandler(e) {
    const nodeID = parseInt(e.node.id, 10);
    let { prevNodeID } = this.state;
    const { onRowSelected } = this.props;

    const { selectedRecords } = this.state;

    let newSelectedRecords;
    // 1. first time selecting a row OR just a regular ole click
    if (prevNodeID === null || (!e.event.ctrlKey && !e.event.shiftKey)) {
      prevNodeID = nodeID;
      newSelectedRecords = [new SelectionRange(nodeID, nodeID)];
    } else {
      // 2. shift key is pressed. This means an interval will be extended
      if (e.event.shiftKey) {
        const isCurrNodeInSelection = this.isNodeAlreadySelected(nodeID, selectedRecords);
        if (isCurrNodeInSelection) {
          // reset selection range to whatever the current selected row is
          prevNodeID = nodeID;
          newSelectedRecords = [new SelectionRange(nodeID, nodeID)];
        } else {
          const intervalPrevNodeIsIn = this.findIntervalIndex(prevNodeID, selectedRecords);
          if (nodeID > prevNodeID) {
            const lastIndex = selectedRecords.length - 1;
            if (intervalPrevNodeIsIn === lastIndex) {
              // extend last interval in selection
              const prevNodeInterval = selectedRecords[lastIndex];
              const newInterval = new SelectionRange(prevNodeInterval.minVal, nodeID);
              prevNodeID = nodeID;
              newSelectedRecords = this.forwardExtendAndUpdateIntervals(intervalPrevNodeIsIn, selectedRecords, newInterval);
            } else {
              // extend an interval in the selection and remove any redundant intervals it contains
              const prevNodeInterval = selectedRecords[intervalPrevNodeIsIn];
              const newInterval = new SelectionRange(prevNodeInterval.minVal, nodeID);
              newSelectedRecords = this.forwardExtendAndUpdateIntervals(intervalPrevNodeIsIn, selectedRecords, newInterval);
              prevNodeID = nodeID;
            }
          } else {
            // extending an interval in the selection backwards and remove any redundant intervals
            const prevNodeInterval = selectedRecords[intervalPrevNodeIsIn];
            const newInterval = new SelectionRange(nodeID, prevNodeInterval.maxVal);
            newSelectedRecords = this.backwardExtendAndUpdateIntervals(intervalPrevNodeIsIn, selectedRecords, newInterval);
            prevNodeID = nodeID;
          }
          newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
        }
      }

      // 3. ctrl key adds a new interval to selection unless it has already been selected
      if (e.event.ctrlKey) {
        const isCurrNodeInSelection = this.isNodeAlreadySelected(nodeID, selectedRecords);
        if (isCurrNodeInSelection) {
          prevNodeID = nodeID;
          newSelectedRecords = selectedRecords.slice();
        } else {
          const newInterval = new SelectionRange(nodeID, nodeID);

          // Add new interval in selection at it's appropriate spot.
          // Selection is a sorted array of intervals
          newSelectedRecords = this.insertIntervalIntoSelection(newInterval, selectedRecords);
          // May need to merge intervals with the addition of a new one
          newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
          prevNodeID = nodeID;
        }
      }
    }
    this.setState({ selectedRecords: newSelectedRecords, prevNodeID });

    this.selectNodeRowsInTable(this.gridApi, newSelectedRecords);
    const totalNumOfRows = this.getTotalNumOfSelectedRows(newSelectedRecords);
    onRowSelected(totalNumOfRows);
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
    gridOptions.cacheBlockSize = 50; // default cacheBlockSize
  }

  renderOptionsMenu() {
    const {
      allColumns, activeColumns, allGroups, activeGroups, totalNumOfRows, selectedRecords,
    } = this.state;
    const { optionsMenuAnchor, optionsMenuOnClose } = this.props;
    const ignorePreviewColumns = colId => !colId.endsWith('.preview');

    const selectionCount = this.getTotalNumOfSelectedRows(selectedRecords);
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

    if (totalNumOfRows < 1000) {
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
          cacheBlockSize={50}
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
          onCellKeyDown={this.handleOnCellKeyDown}
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
