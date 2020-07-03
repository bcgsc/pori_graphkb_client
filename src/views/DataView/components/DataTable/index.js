import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import { AgGridReact } from 'ag-grid-react';
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

import { getUsername } from '@/services/auth';
import schema from '@/services/schema';

import GridContext from './GridContext';
import TableOptions from './TableOptions';

const CACHE_BLOCK_SIZE = 50;


class DataTable extends React.Component {
  static propTypes = {
    cache: PropTypes.object.isRequired,
    isExportingData: PropTypes.func.isRequired,
    optionsMenuOnClose: PropTypes.func.isRequired,
    onRecordClicked: PropTypes.func,
    optionsMenuAnchor: PropTypes.object,
    rowBuffer: PropTypes.number,
    search: PropTypes.string,
    totalRows: PropTypes.number,
  };

  static defaultProps = {
    search: '',
    rowBuffer: 200,
    onRecordClicked: null,
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
    };
  }

  componentDidUpdate(prevProps) {
    const { search } = this.props;

    if (this.gridApi && search !== prevProps.search) {
      this.initializeGrid();
    }
  }

  @boundMethod
  onGridReady({ api: gridApi, columnApi }) {
    this.gridApi = gridApi;
    this.gridColumnApi = columnApi;
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
  async handleExportTsv() {
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
      processCellCallback: ({ value }) => {
        if (Array.isArray(value)) {
          return value.map(formatValue).join(';');
        }
        return formatValue(value);
      },
    };

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

  render() {
    const {
      gridReady,
    } = this.state;
    const { onRecordClicked, optionsMenuAnchor, optionsMenuOnClose } = this.props;

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
        <GridContext.Provider value={{ gridApi: this.gridApi, colApi: this.gridColumnApi, gridReady }}>
          <TableOptions
            anchorEl={optionsMenuAnchor}
            onClose={optionsMenuOnClose}
            onExportToTsv={() => this.handleExportTsv()}
          />
        </GridContext.Provider>
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
          onGridReady={this.onGridReady}
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
