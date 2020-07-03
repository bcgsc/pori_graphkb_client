import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import { AgGridReact } from 'ag-grid-react';
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

import { getUsername } from '@/services/auth';
import schema from '@/services/schema';

import { SelectionTracker } from '../SelectionTracker';
import GridContext from './GridContext';
import TableOptions from './TableOptions';

const CACHE_BLOCK_SIZE = 50;


class DataTable extends React.Component {
  static propTypes = {
    cache: PropTypes.object.isRequired,
    isExportingData: PropTypes.func.isRequired,
    onRowSelected: PropTypes.func.isRequired,
    optionsMenuOnClose: PropTypes.func.isRequired,
    totalRowsSelected: PropTypes.number.isRequired,
    onRecordClicked: PropTypes.func,
    onRecordsSelected: PropTypes.func,
    optionsMenuAnchor: PropTypes.object,
    rowBuffer: PropTypes.number,
    search: PropTypes.string,
    totalRows: PropTypes.number,
  };

  static defaultProps = {
    search: '',
    rowBuffer: 200,
    onRecordClicked: null,
    onRecordsSelected: null,
    optionsMenuAnchor: null,
    totalRows: null,
  };

  constructor(props) {
    super(props);
    this.api = null;
    this.columnApi = null;
    this.state = {
      // active columns
      gridReady: false,
      pingedIndices: new Set(),
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
    this.setState({ gridReady: true });
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
    const selectedRecords = selectionTracker.selection;
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
    const selectedRecords = selectionTracker.selection;
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

  initializeGrid() {
    const { search } = this.props;

    this.gridApi.setColumnDefs([
      ...schema.defineGridColumns(search),
    ]);


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
    this.gridApi.setDatasource(dataSource);
  }


  @boundMethod
  async handleExportTsv(selectionOnly = false) {
    const { selectionTracker } = this.state;
    const { isExportingData, totalRows } = this.props;
    isExportingData(true);

    const { gridOptions } = this.gridApi.getModel().gridOptionsWrapper;
    const header = `## Exported from GraphKB at ${new Date()} by ${getUsername(this.context)}
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
      gridOptions.cacheBlockSize = totalRows; // in preparation to fetch entire dataset

      const tempDataSource = {
        rowCount: null,
        getRows: async ({
          successCallback, failCallback, ...params
        }) => {
          params.endRow = totalRows; // fetches entire data set with this adjustment

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
      const lastIndex = selectionTracker.selection.length - 1;
      const maxSelectedRow = selectionTracker.selection[lastIndex].maxVal;
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
      this.selectNodeRowsInTable(this.gridApi, newSelectionTracker);
      const totalNumOfRows = newSelectionTracker.getTotalNumOfSelectedRows();
      onRowSelected(totalNumOfRows);
    } else if (type === 'keydown') {
      if (key === 'Shift') {
        rowNode.setSelected(true);
        newSelectionTracker = selectionTracker.checkAndUpdate(nodeID, selectionTracker);
        prevNodeID = nodeID;

        this.setState({ selectionTracker: newSelectionTracker, prevNodeID });
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
      selectionTracker,
      gridReady,
    } = this.state;

    const { optionsMenuAnchor, optionsMenuOnClose, totalRowsSelected } = this.props;

    return (
      <GridContext.Provider value={{ gridApi: this.gridApi, colApi: this.gridColumnApi, gridReady }}>
        <TableOptions
          anchorEl={optionsMenuAnchor}
          onClose={optionsMenuOnClose}
          onExportToTsv={selectedOnly => this.handleExportTsv(selectedOnly)}
          selectionTracker={selectionTracker}
          totalRowsSelected={totalRowsSelected}
        />
      </GridContext.Provider>
    );
  }

  render() {
    const { onRecordClicked, onRecordsSelected } = this.props;

    return (
      <div
        className="ag-theme-material data-table"
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        role="presentation"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {this.renderOptionsMenu()}
        <AgGridReact
          blockLoadDebounceMillis={100}
          cacheBlockSize={CACHE_BLOCK_SIZE}
          cacheOverflowSize={1}
          defaultColDef={{
            sortable: true,
            resizable: true,
            width: 150,
          }}
          groupHeaderHeight={30}
          infiniteInitialRowCount={1}
          maxBlocksInCache={0}
          maxConcurrentDatasourceRequests={1}
          onBodyScroll={this.detectFetchTrigger}
          onCellFocused={({ rowIndex }) => {
            if (rowIndex !== null && onRecordClicked) {
              const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
              onRecordClicked(rowNode);
            }
          }}
          onCellKeyDown={this.handleSelectionChange}
          onGridReady={this.onGridReady}
          onSelectionChanged={() => {
            if (onRecordsSelected) {
              const rows = this.gridApi.getSelectedRows();
              onRecordsSelected(rows);
            }
          }}
          paginationPageSize={25}
          reactNext
          // allow the user to select using the arrow keys and shift
          rowModelType="infinite"
          rowSelection="multiple"
          suppressHorizontalScroll={false}
          suppressMultiSort
        />
      </div>
    );
  }
}

export default DataTable;
