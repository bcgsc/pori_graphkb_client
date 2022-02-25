import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import './index.scss';

import {
  IconButton,
} from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { AgGridReact } from 'ag-grid-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIsFetching, useQuery } from 'react-query';
import { RouteComponentProps } from 'react-router-dom';

import DetailDrawer from '@/components/DetailDrawer';
import useGrid from '@/components/hooks/useGrid';
import { GeneralRecordType } from '@/components/types';
import api from '@/services/api';
import schema from '@/services/schema';
import util from '@/services/util';
import config from '@/static/config';

import ActiveFilters from './components/ActiveFilters';
import Footer from './components/Footer';
import TableOptions from './components/TableOptions';

const CACHE_BLOCK_SIZE = 50;
const { DEFAULT_NEIGHBORS, MAX_EXPORT_SIZE } = config;

/**
 * Create an API call for retrieving a block/page of rows/records
 *
 * @param {object} opt
 * @param {string} opt.search the query string
 * @param {Schema} opt.schema
 * @param {Array.<SortModel>} opt.sortModel the sort model
 * @param {number} opt.skip the number of records to skip on return
 * @param {number} opt.limit the maximum number of records to return
 * @param {boolean} opt.count count the records instead of returning them
 *
 * @returns {ApiCall} the api call for retriving the requested data
 */
const getQueryPayload = ({
  search, sortModel, skip, limit, count = false,
}) => {
  const { payload } = api.getQueryFromSearch({
    schema,
    search,
    count,
  });
  const content = payload || { neighbors: DEFAULT_NEIGHBORS };

  if (count) {
    content.count = true;
    delete content.neighbors;
  } else {
    content.skip = skip;
    content.limit = limit;

    if (sortModel.length) {
      const [{ colId: orderBy, sort: orderByDirection }] = sortModel;
      content.orderBy = orderBy;
      content.orderByDirection = orderByDirection.toUpperCase();
    }
  }

  return content;
};

/**
 * Get rows from cached blocks
 */
const getRowsFromBlocks = async ({
  startRow,
  endRow, // exclusive
  sortModel,
  search,
  blockSize,
}) => {
  const firstBlock = Math.floor(startRow / blockSize) * blockSize;
  const lastBlock = Math.floor((endRow - 1) / blockSize) * blockSize;

  const blockRequests: Promise<GeneralRecordType[]>[] = [];

  for (let block = firstBlock; block <= lastBlock; block += blockSize) {
    const payload = getQueryPayload({
      search, skip: block, limit: blockSize, sortModel,
    });

    blockRequests.push(api.queryClient.fetchQuery(
      ['/query', payload] as const,
      async ({ queryKey: [_, body] }) => api.query(body),
    ));
  }
  const data: GeneralRecordType[] = [];
  (await Promise.all(blockRequests)).forEach((block) => data.push(...block));

  data.forEach((record) => {
    api.queryClient.setQueryData(
      ['/query', { target: [record['@rid']], neighbors: DEFAULT_NEIGHBORS }],
      [record],
    );
  });
  return data.slice(startRow - firstBlock, endRow - firstBlock);
};

interface DataViewProps {
  history: RouteComponentProps['history'];
  location: RouteComponentProps['location'];
  blockSize?: number;
}

/**
 * Shows the search result filters and an edit button
 */
function DataView(props: DataViewProps) {
  const {
    location: { search: initialSearch },
    blockSize = 100,
    history,
  } = props;
  const [isExportingData, setIsExportingData] = useState(false);
  const isLoading = useIsFetching();
  const [search, setSearch] = useState(initialSearch);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [optionsMenuAnchor, setOptionsMenuAnchor] = useState(null);
  const [detailsRowId, setDetailsRowId] = useState(null);
  const grid = useGrid();

  const payload = useMemo(() => getQueryPayload({
    search, count: true,
  }), [search]);

  const { data: totalRows = null } = useQuery(
    ['/query', payload] as const,
    async ({ queryKey: [_, body] }) => api.query(body),
    {
      select: (response) => response[0]?.count,
    },
  );

  const initializeGrid = useCallback(() => {
    const gridApi = grid.ref?.current?.api;

    if (!gridApi) { return; }

    gridApi.setColumnDefs([
      ...schema.defineGridColumns(search),
    ]);

    const dataSource = {
      rowCount: null,
      getRows: ({
        successCallback, failCallback, ...params
      }) => {
        const getTableData = async ({
          startRow,
          endRow, // exclusive
          sortModel,
        }) => {
          const result = await getRowsFromBlocks({
            startRow, endRow, sortModel, search, blockSize,
          });
          return [result, totalRows];
        };

        getTableData(params)
          .then(([rows, lastRow]) => {
            // update filters
            successCallback(rows, lastRow);
          }).catch(() => failCallback());
      },
    };
      // update the model
    gridApi.setDatasource(dataSource);
  }, [blockSize, grid.ref, search, totalRows]);

  useEffect(() => {
    // normalize the input query
    const newSearch = api.getSearchFromQuery({
      ...api.getQueryFromSearch({ search: initialSearch, schema }), schema,
    });
    setSearch(newSearch);
  }, [initialSearch]);

  // set up infinitite row model data source
  useEffect(() => {
    const gridApi = grid.ref?.current?.api;

    if (!gridApi) { return; }

    const handleSelectionChange = () => {
      const newSelection = gridApi.getSelectedRows();
      setSelectedRecords(newSelection);
    };

    initializeGrid();
    gridApi.addEventListener('selectionChanged', handleSelectionChange);
  }, [blockSize, grid.ref, initializeGrid, search, totalRows]);

  const handleError = useCallback((err) => {
    util.handleErrorSaveLocation(err, history, { pathname: '/data/table', search });
  }, [history, search]);

  const { data: detailPanelRow } = useQuery(
    ['/query', { target: [detailsRowId], neighbors: DEFAULT_NEIGHBORS }] as const,
    async ({ queryKey: [_, body] }) => api.query(body),
    {
      enabled: Boolean(detailsRowId),
      onError: (err) => handleError(err),
      select: (response) => response[0],
    },
  );

  const handleToggleDetailPanel = useCallback(async (params) => {
    // no data or clicked link is a link property without a class model
    if (!params?.data || params.data.isLinkProp) {
      setDetailsRowId(null);
    } else {
      setDetailsRowId(params.data['@rid']);
    }
  }, []);

  /**
   * Opens the options menu. The trigger is defined on this component but
   * the menu contents are handled by the data element (ex DataTable)
   */
  const handleOpenOptionsMenu = useCallback(({ currentTarget = null } = {}) => {
    setOptionsMenuAnchor(currentTarget);
  }, []);

  const handleClickExport = useCallback(async () => {
    const gridApi = grid.ref?.current?.api;

    if (!gridApi) { return; }

    const username = ''; // getUsername(context);
    const header = `## Exported from GraphKB at ${new Date()} by ${username}
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

    if (!isExportingData) {
      setIsExportingData(true);

      const maxExportSize = Math.min(MAX_EXPORT_SIZE, totalRows);

      const allRows = await getRowsFromBlocks({
        startRow: 0,
        endRow: maxExportSize,
        sortModel: gridApi.sortController.getSortModel(),
        search,
        blockSize,
      });
      const { gridOptions } = gridApi.getModel().gridOptionsWrapper;
      gridOptions.cacheBlockSize = maxExportSize; // in preparation to fetch entire dataset

      const tempDataSource = {
        rowCount: totalRows,
        getRows: async ({
          successCallback, failCallback,
        }) => {
          try {
            successCallback(allRows, allRows.length);
            await gridApi.exportDataAsCsv(exportParams);
            setIsExportingData(false);
            initializeGrid();
          } catch (err) {
            console.error(err);
            failCallback();
          }
        },
      };

      gridApi.setDatasource(tempDataSource);
    }
  }, [blockSize, grid.ref, initializeGrid, isExportingData, search, totalRows]);

  const detailPanelIsOpen = Boolean(detailPanelRow);

  let statusMessage = '';

  if (isExportingData || isLoading) {
    statusMessage = isExportingData
      ? 'exporting'
      : 'loading more';

    if (totalRows !== null) {
      statusMessage = `${statusMessage} of ${totalRows} rows`;
    } else {
      statusMessage = `${statusMessage} rows ....`;
    }
  }
  return (
    <div className={
        `data-view ${detailPanelIsOpen
          ? 'data-view--squished'
          : ''}`
}
    >
      <div className="data-view__header">
        <ActiveFilters search={search} />
        <Tooltip title="click here for table and export options">
          <IconButton className="data-view__edit-filters" onClick={handleOpenOptionsMenu}>
            <MoreHorizIcon color="action" />
          </IconButton>
        </Tooltip>
      </div>
      <div className="data-view__content">
        <div
          className="ag-theme-material data-table"
          role="presentation"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <TableOptions
            anchorEl={optionsMenuAnchor}
            gridRef={grid.ref}
            onClose={() => setOptionsMenuAnchor(null)}
            onExportToTsv={(totalRows !== null) && handleClickExport}
          />
          <AgGridReact
            {...grid.props}
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
            onCellFocused={({ rowIndex }) => {
              const gridApi = grid.ref?.current?.api;

              if (gridApi && rowIndex !== null) {
                const rowNode = gridApi.getDisplayedRowAtIndex(rowIndex);
                handleToggleDetailPanel(rowNode);
              }
            }}
            paginationPageSize={25}
            rowModelType="infinite"
            // allow the user to select using the arrow keys and shift
            rowSelection="multiple"
            suppressHorizontalScroll={false}
            suppressMultiSort
          />
        </div>
        <DetailDrawer
          node={detailPanelRow}
          onClose={handleToggleDetailPanel}
        />
      </div>
      <Footer
        history={history}
        onError={handleError}
        selectedRecords={selectedRecords}
        statusMessage={statusMessage}
        totalRows={totalRows}
      />
    </div>
  );
}

DataView.defaultProps = {
  blockSize: 100,
};

export default DataView;