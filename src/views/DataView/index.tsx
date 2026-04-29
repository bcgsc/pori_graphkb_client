import './index.scss';

import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  IconButton,
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { IRowNode, themeMaterial } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  QueryClient, useIsFetching, useQuery, useQueryClient,
} from 'react-query';
import { useLocation, useNavigate } from 'react-router';

import DetailDrawer from '@/components/DetailDrawer';
import useGrid from '@/components/hooks/useGrid';
import { GeneralRecordType } from '@/components/types';
import { tuple } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';
import util from '@/services/util';
import config from '@/static/config';

import ActiveFilters from './components/ActiveFilters';
import Footer from './components/Footer';
import TableOptions from './components/TableOptions';

const CACHE_BLOCK_SIZE = 50;
const DEFAULT_BLOCK_SIZE = 100;
const { DEFAULT_NEIGHBORS, MAX_EXPORT_SIZE } = config;

interface GetQueryPayloadArgs {
  /** the query string */
  search: string;
  /**
   * the sort model
   */
  sortModel?: { colId: string; sort: string; }[];
  /** the number of records to skip on return */
  skip?: number;
  /** the maximum number of records to return */
  limit?: number;
  /** count the records instead of returning them */
  count?: boolean;
}

/**
 * Create an API call for retrieving a block/page of rows/records
 *
 * @returns {ApiCall} the api call for retriving the requested data
 */
const getQueryPayload = ({
  search, sortModel, skip, limit, count = false,
}: GetQueryPayloadArgs) => {
  const { payload } = api.getQueryFromSearch(search);
  const content = payload || { neighbors: DEFAULT_NEIGHBORS };

  if (count) {
    content.count = true;
    delete content.neighbors;
  } else {
    content.skip = skip;
    content.limit = limit;

    if (sortModel?.length) {
      const [{ colId: orderBy, sort: orderByDirection }] = sortModel;
      content.orderBy = orderBy;
      content.orderByDirection = orderByDirection.toUpperCase() as 'DESC' | 'ASC';
    }
  }

  return content;
};

interface GetRowsFromBlocksArgs {
  startRow: number;
  endRow: number;
  sortModel?: { colId: string; sort: string; }[];
  search: string;
  blockSize: number;
  queryClient: QueryClient;
}

/**
 * Get rows from cached blocks
 */
const getRowsFromBlocks = async ({
  startRow,
  endRow, // exclusive
  sortModel,
  search,
  blockSize,
  queryClient,
}: GetRowsFromBlocksArgs) => {
  const firstBlock = Math.floor(startRow / blockSize) * blockSize;
  const lastBlock = Math.floor((endRow - 1) / blockSize) * blockSize;

  const blockRequests: Promise<GeneralRecordType[]>[] = [];

  for (let block = firstBlock; block <= lastBlock; block += blockSize) {
    const payload = getQueryPayload({
      search, skip: block, limit: blockSize, sortModel,
    });

    blockRequests.push(queryClient.fetchQuery({
      queryKey: tuple('/query', payload),
      queryFn: async ({ queryKey: [, body] }) => api.query(body),
    }));
  }
  const data: GeneralRecordType[] = [];
  (await Promise.all(blockRequests)).forEach((block) => data.push(...block));

  data.forEach((record) => {
    queryClient.setQueryData(
      ['/query', { target: [record['@rid']], neighbors: DEFAULT_NEIGHBORS }],
      [record],
    );
  });
  return data.slice(startRow - firstBlock, endRow - firstBlock);
};

/**
 * Shows the search result filters and an edit button
 */
const DataView = (): React.JSX.Element => {
  const {
    search: initialSearch,
  } = useLocation();
  const navigate = useNavigate();
  const [isExportingData, setIsExportingData] = useState(false);
  const isLoading = useIsFetching();
  const [search, setSearch] = useState(initialSearch);
  const [selectedRecords, setSelectedRecords] = useState<GeneralRecordType[]>([]);
  const [optionsMenuAnchor, setOptionsMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [detailsRowId, setDetailsRowId] = useState<string | null>(null);
  const grid = useGrid();
  const queryClient = useQueryClient();

  const payload = useMemo(() => getQueryPayload({
    search, count: true,
  }), [search]);

  const { data: totalRows } = useQuery({
    queryKey: tuple('/query', payload),
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
    select: (response) => response[0]?.count,
  });

  const initializeGrid = useCallback(() => {
    const gridApi = grid.ref?.current?.api;

    if (!gridApi) { return; }

    gridApi.setGridOption('columnDefs', [
      ...schema.defineGridColumns(search),
    ]);

    gridApi.setGridOption('datasource', {
      rowCount: undefined,
      getRows: ({
        successCallback, failCallback, ...params
      }) => {
        const getTableData = async ({
          startRow,
          endRow, // exclusive
          sortModel,
        }) => {
          const result = await getRowsFromBlocks({
            startRow, endRow, sortModel, search, blockSize: DEFAULT_BLOCK_SIZE, queryClient,
          });
          return [result, totalRows] as const;
        };

        getTableData(params)
          .then(([rows, lastRow]) => {
            // update filters
            successCallback(rows, lastRow);
          }).catch(() => failCallback());
      },
    });
  }, [grid.ref, search, totalRows, queryClient]);

  useEffect(() => {
    // normalize the input query
    const newSearch = api.getSearchFromQuery(api.getQueryFromSearch(initialSearch));
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
  }, [grid.ref, initializeGrid, search, totalRows]);

  const handleError = useCallback((err) => {
    util.handleErrorSaveLocation(err, { navigate, pathname: '/data/table', search });
  }, [navigate, search]);

  const { data: detailPanelRow, error } = useQuery({
    queryKey: tuple('/query', { target: [detailsRowId!], neighbors: DEFAULT_NEIGHBORS }),
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
    enabled: Boolean(detailsRowId),
    select: (response) => response[0],
  });

  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  const handleToggleDetailPanel = useCallback((params?: IRowNode | null) => {
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
  const handleOpenOptionsMenu = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    setOptionsMenuAnchor(e?.currentTarget ?? null);
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
        return schema.getLabel(value, { truncate: false });
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

      const maxExportSize = Math.min(MAX_EXPORT_SIZE, totalRows ?? 0);

      const allRows = await getRowsFromBlocks({
        startRow: 0,
        endRow: maxExportSize,
        // @ts-expect-error private property
        sortModel: gridApi.sortController.getSortModel(),
        search,
        blockSize: DEFAULT_BLOCK_SIZE,
        queryClient,
      });
      // @ts-expect-error doesn't exist?
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

      gridApi.setGridOption('datasource', tempDataSource);
    }
  }, [grid.ref, initializeGrid, isExportingData, search, totalRows, queryClient]);

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
    <div className={`data-view ${detailPanelIsOpen ? 'data-view--squished' : ''}`}>
      <div className="data-view__header">
        <ActiveFilters search={search} />
        <Tooltip title="click here for table and export options">
          <IconButton
            className="data-view__edit-filters"
            onClick={handleOpenOptionsMenu}
          >
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
            onExportToTsv={(totalRows !== null) ? handleClickExport : undefined}
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
            enableCellTextSelection
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
            rowSelection="multiple"
            // allow the user to select using the arrow keys and shift
            suppressHorizontalScroll={false}
            suppressMultiSort
            theme={themeMaterial}
          />
        </div>
        <DetailDrawer
          node={detailPanelRow}
          onClose={handleToggleDetailPanel}
        />
      </div>
      <Footer
        navigate={navigate}
        onError={handleError}
        selectedRecords={selectedRecords}
        statusMessage={statusMessage}
        totalRows={totalRows as number}
      />
    </div>
  );
};

export default DataView;
