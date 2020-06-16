import './index.scss';

import {
  CircularProgress,
  IconButton,
  Typography,
} from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import FilterListIcon from '@material-ui/icons/FilterList';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import TimelineIcon from '@material-ui/icons/Timeline';
import PropTypes from 'prop-types';
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';

import DetailDrawer from '@/components/DetailDrawer';
import { HistoryPropType, LocationPropType } from '@/components/types';
import { navigateToGraph } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';

import util from '../../services/util';
import PaginationDataCache from './components/dataCache';
import DataTable from './components/DataTable';
import FilterChips from './components/FilterChips';
import FilterTablePopover from './components/FilterTablePopover';
import {
  getFilterTableProps,
  getPopularChipsPropsAndSearch,
} from './util';


const parseFilters = async (cache, search) => {
  const {
    queryParams, modelName, searchProps, searchProps: { searchType }, payload,
  } = api.getQueryFromSearch({ search, schema });

  let chipProps = searchProps;
  let newSearch = null;

  if (searchType === 'Popular') {
    const {
      search: encodedSearch,
      chipProps: popChipProps,
    } = await getPopularChipsPropsAndSearch(searchProps, modelName);
    newSearch = encodedSearch;
    chipProps = popChipProps;
  }

  let filterGroups = [];

  if (searchType === 'Advanced') {
    const { filters } = payload;
    filterGroups = await getFilterTableProps(filters, cache);
  }

  return {
    '@class': modelName, ...queryParams, ...chipProps, filterGroups, newSearch,
  };
};

/**
 * Shows the search result filters and an edit button
 */
const DataView = ({
  location: { search: initialSearch }, cacheBlocks, blockSize, history, bufferSize,
}) => {
  const cache = useRef(null);
  const [statusMessage, setStatusMessage] = useState('loading data...');
  const [isExportingData, setIsExportingData] = useState(false);
  const [totalRows, setTotalRows] = useState(null);
  const [search, setSearch] = useState(initialSearch);
  const [searchType, setSearchType] = useState('Quick');
  const [totalRowsSelected, setTotalRowsSelected] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterGroups, setFilterGroups] = useState({});
  const [detailPanelRow, setDetailPanelRow] = useState(null);
  const [optionsMenuAnchor, setOptionsMenuAnchor] = useState(null);
  const [filterTableAnchorEl, setFilterTableAnchorEl] = useState(null);

  const handleLoadingChange = useCallback(() => {
    if (!cache.current) {
      return;
    }
    const rowCount = cache.current.rowCount(search);
    const [start, end] = cache.current.pendingRows(search);

    let msg;

    if (start !== null) {
      msg = `${isExportingData ? 'Exporting' : 'Requesting'} ${start} - ${end}`;

      if (rowCount !== undefined) {
        msg = `${msg} of ${rowCount} rows`;
      } else {
        msg = `${msg} rows ....`;
      }
    }
    setStatusMessage(msg);
    setTotalRows(rowCount);
  }, [isExportingData, search]);

  const handleError = useCallback((err) => {
    util.handleErrorSaveLocation(err, history, { pathname: '/data/table', search });
  }, [history, search]);

  useEffect(() => {
    cache.current = new PaginationDataCache({
      schema,
      cacheBlocks,
      blockSize,
      onLoadCallback: handleLoadingChange,
      onErrorCallback: handleError,
    });

    return () => cache && cache.current && cache.current.abortAll();
  }, [blockSize, cacheBlocks, handleError, handleLoadingChange]);

  useEffect(() => {
    const reParseFilters = async () => {
      const parsed = await parseFilters(cache.current, search);
      setSearchType(parsed.searchType);
      setFilters(parsed.filters);
      setFilterGroups(parsed.filterGroups);

      if (parsed.search) {
        setSearch(parsed.search);
      }
    };
    reParseFilters();
  }, [search]);


  const handleToggleDetailPanel = useCallback(async ({ data } = {}) => {
    // no data or clicked link is a link property without a class model
    if (!data || data.isLinkProp) {
      setDetailPanelRow(null);
    } else {
      try {
        const fullRecord = await cache.current.getRecord(data);

        if (!fullRecord) {
          setDetailPanelRow(null);
        } else {
          setDetailPanelRow(fullRecord);
        }
      } catch (err) {
        handleError(err);
      }
    }
  }, [handleError]);

  /**
   * Opens the options menu. The trigger is defined on this component but
   * the menu contents are handled by the data element (ex DataTable)
   */
  const handleOpenOptionsMenu = useCallback(({ currentTarget }) => {
    setOptionsMenuAnchor(currentTarget);
  }, []);


  const handleRecordSelection = useCallback(async (newSelectedRecords) => {
    try {
      const fullRecords = await cache.current.getRecords(newSelectedRecords);
      setSelectedRecords(fullRecords);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const handleGraphStateSaveIntoURL = useCallback((nodeRIDs) => {
    navigateToGraph(nodeRIDs, history, handleError);
  }, [handleError, history]);

  const handleSwapToGraph = useCallback(() => {
    const nodeRIDs = selectedRecords.map(node => node['@rid']);
    handleGraphStateSaveIntoURL(nodeRIDs);
  }, [handleGraphStateSaveIntoURL, selectedRecords]);

  const handleExportLoader = (boolean) => {
    setIsExportingData(boolean);
  };

  const handleNewRowSelection = (newTotal) => {
    setTotalRowsSelected(newTotal);
  };

  const handleFilterTableToggle = (event, openState) => {
    if (openState === 'open') {
      setFilterTableAnchorEl(event.currentTarget);
    } else {
      setFilterTableAnchorEl(null);
    }
  };

  const detailPanelIsOpen = Boolean(detailPanelRow);
  return (
    <div className={
        `data-view ${detailPanelIsOpen
          ? 'data-view--squished'
          : ''}`}
    >
      <div className="data-view__header">
        <>
          <Typography variant="h5">{searchType} Search</Typography>
          <FilterChips {...filters} />
          {(searchType === 'Advanced') && (
            <>
              <Tooltip title="click here to see active filter groups">
                <IconButton
                  disabled={!filterGroups}
                  onClick={event => handleFilterTableToggle(event, 'open')}
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              {(filterGroups) && (
              <FilterTablePopover
                anchorEl={filterTableAnchorEl}
                filterGroups={filterGroups}
                handleToggle={event => handleFilterTableToggle(event, 'close')}
                isOpen={Boolean(filterTableAnchorEl)}
              />
              )}
            </>
          )}
        </>
        <Tooltip title="click here for table and export options">
          <IconButton className="data-view__edit-filters" onClick={handleOpenOptionsMenu}>
            <MoreHorizIcon color="action" />
          </IconButton>
        </Tooltip>
      </div>
      <div className="data-view__content">
        {cache.current && (
        <>
          <DataTable
            cache={cache.current}
            isExportingData={handleExportLoader}
            onRecordClicked={handleToggleDetailPanel}
            onRecordsSelected={handleRecordSelection}
            onRowSelected={handleNewRowSelection}
            optionsMenuAnchor={optionsMenuAnchor}
            optionsMenuOnClose={() => setOptionsMenuAnchor(null)}
            rowBuffer={bufferSize}
            search={search}
            totalRows={totalRows}
            totalRowsSelected={totalRowsSelected}
          />
          <DetailDrawer
            node={detailPanelRow}
            onClose={handleToggleDetailPanel}
          />
        </>
        )}
      </div>
      <div className="data-view__footer">
        <div className="footer__selected-records">
          <Typography variant="body2">
            {totalRowsSelected} Record{totalRowsSelected !== 1 ? 's' : ''} Selected
          </Typography>
          <Tooltip title="click here for graph view">
            <IconButton
              disabled={selectedRecords.length === 0}
              onClick={handleSwapToGraph}
            >
              <TimelineIcon
                color={selectedRecords.length === 0 ? 'disabled' : 'secondary'}
              />
            </IconButton>
          </Tooltip>
        </div>
        {statusMessage && (
        <div className="footer__loader">
          <CircularProgress />
          <Typography variant="body2">
            {statusMessage}
          </Typography>
        </div>
        )}
        <Typography className="footer__total-rows" variant="body2">
          Total Rows: {totalRows === undefined ? 'Unknown' : totalRows}
        </Typography>

      </div>

    </div>
  );
};


DataView.propTypes = {
  history: HistoryPropType.isRequired,
  location: LocationPropType.isRequired,
  blockSize: PropTypes.number,
  bufferSize: PropTypes.number,
  cacheBlocks: PropTypes.number,
};

DataView.defaultProps = {
  cacheBlocks: 10,
  blockSize: 100,
  bufferSize: 200,
};

export default DataView;
