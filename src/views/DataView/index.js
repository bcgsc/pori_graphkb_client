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
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';
import * as qs from 'qs';
import React from 'react';

import { HistoryPropType, LocationPropType } from '@/components/types';
import api from '@/services/api';
import schema from '@/services/schema';

import util from '../../services/util';
import DataTable from './components/DataTable';
import DetailDrawer from './components/DetailDrawer';
import FilterChips from './components/FilterChips';
import FilterTablePopover from './components/FilterTablePopover';
import GraphComponent from './components/GraphComponent';
import { hashRecordsByRID } from './util';

/**
 * Shows the search result filters and an edit button
 */
class DataView extends React.Component {
  static propTypes = {
    location: LocationPropType.isRequired,
    history: HistoryPropType.isRequired,
    cacheBlocks: PropTypes.number,
    blockSize: PropTypes.number,
    bufferSize: PropTypes.number,
  };

  static defaultProps = {
    cacheBlocks: 10,
    blockSize: 100,
    bufferSize: 200,
  };

  constructor(props) {
    super(props);
    const { location: { search } } = this.props;
    // cache for api requests
    this.state = {
      cache: null,
      statusMessage: 'loading data...',
      totalRows: null,
      detailPanelRow: null,
      optionsMenuAnchor: null,
      selectedRecords: [],
      filters: {},
      filterGroups: null,
      filterTableOpen: false,
      filterTableAnchorEl: null,
      search,
      searchType: 'Quick',
      isExportingData: false,
      totalRowsSelected: 0,
      graphData: null,
    };
    this.controllers = [];
  }

  async componentDidMount() {
    const { cacheBlocks, blockSize } = this.props;
    const cache = api.getNewCache({
      schema,
      cacheBlocks,
      blockSize,
      onLoadCallback: this.handleLoadingChange,
      onErrorCallback: this.handleError,
    });

    const {
      searchType, limit, neighbors, ...filters
    } = this.parseFilters();
    this.setState({ cache, filters, searchType });
  }

  componentWillUnmount() {
    const { cache } = this.state;

    if (cache) {
      cache.abortAll();
    }
  }

  /**
   * Grab filters from search and sets filtergroups if it is advanced search
   */
  parseFilters() {
    const { search } = this.state;

    try {
      const {
        queryParams, modelName, searchChipProps, searchChipProps: { searchType },
      } = api.getQueryFromSearch({ search, schema });

      if (searchType === 'Advanced') {
        const { filters: filterGroups } = searchChipProps;
        this.setState({ filterGroups });
        delete searchChipProps.filters;
      }

      return { '@class': modelName, ...queryParams, ...searchChipProps };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Opens the right-hand panel that shows details of a given record
   */
  @boundMethod
  async handleToggleDetailPanel(opt = {}) {
    const { data } = opt;
    const { cache } = this.state;

    // no data or clicked link is a link property without a class model
    if (!data || data.isLinkProp) {
      this.setState({ detailPanelRow: null });
    } else {
      try {
        const fullRecord = await cache.getRecord(data);

        if (!fullRecord) {
          this.setState({ detailPanelRow: null });
        } else {
          this.setState({ detailPanelRow: fullRecord });
        }
      } catch (err) {
        this.handleError(err);
      }
    }
  }

  /**
   * Opens the options menu. The trigger is defined on this component but
   * the menu contents are handled by the data element (ex DataTable)
   */
  @boundMethod
  handleToggleOptionsMenu({ currentTarget }) {
    const { optionsMenuAnchor } = this.state;

    if (optionsMenuAnchor) {
      this.setState({ optionsMenuAnchor: null });
    } else {
      this.setState({ optionsMenuAnchor: currentTarget });
    }
  }

  @boundMethod
  async handleRecordSelection(selectedRecords) {
    const { cache } = this.state;

    try {
      const fullRecords = await cache.getRecords(selectedRecords);
      this.setState({ selectedRecords: fullRecords });
    } catch (err) {
      this.handleError(err);
    }
  }

  @boundMethod
  handleSwapToGraph() {
    const { selectedRecords } = this.state;
    const nodeRIDs = selectedRecords.map(node => node['@rid']);
    this.handleGraphStateSaveIntoURL(nodeRIDs);
  }

  @boundMethod
  handleError(err) {
    const { history } = this.props;
    history.push('/error', { error: { name: err.name, message: err.message } });
  }

  @boundMethod
  handleExportLoader(boolean) {
    this.setState({ isExportingData: boolean });
  }

  @boundMethod
  handleNewRowSelection(totalRows) {
    this.setState({ totalRowsSelected: totalRows });
  }

  /**
   * Called in response to records being requested or loaded
   * Responsible for giving the user information while waiting for things to load
   */
  @boundMethod
  handleLoadingChange() {
    const { cache, search, isExportingData } = this.state;

    if (!cache) {
      return;
    }
    const rowCount = cache.rowCount(search);
    const [start, end] = cache.pendingRows(search);

    let statusMessage;

    if (start !== null) {
      statusMessage = `${isExportingData ? 'Exporting' : 'Requesting'} ${start} - ${end}`;

      if (rowCount !== undefined) {
        statusMessage = `${statusMessage} of ${rowCount} rows`;
      } else {
        statusMessage = `${statusMessage} rows ....`;
      }
    }
    this.setState({ statusMessage, totalRows: rowCount });
  }

  @boundMethod
  async loadSavedStateFromURL() {
    const { cache } = this.state;
    const URLBeforeNodeEncoding = window.location.href.split('nodes')[0];
    const encodedData = window.location.href.split(URLBeforeNodeEncoding)[1];
    const { nodes } = qs.parse(encodedData.replace(/^\?/, ''));

    try {
      const decodedContent = decodeURIComponent(nodes);
      const base64decoded = atob(decodedContent);
      const decodedNodes = JSON.parse(base64decoded);
      const records = await cache.getRecords(decodedNodes);
      const data = hashRecordsByRID(records);
      this.setState({ graphData: data });
    } catch (err) {
      this.handleError(err);
    }
  }

  @boundMethod
  handleFilterTableToggle(event, openState) {
    if (openState === 'open') {
      this.setState({ filterTableAnchorEl: event.currentTarget, filterTableOpen: true });
    } else {
      this.setState({ filterTableAnchorEl: null, filterTableOpen: false });
    }
  }

  @boundMethod
  handleGraphStateSaveIntoURL(nodeRIDs) {
    const { history } = this.props;

    const savedState = {};
    let encodedState;

    try {
      const stringifiedState = JSON.stringify(nodeRIDs);
      const base64encodedState = btoa(stringifiedState);
      const encodedContent = encodeURIComponent(base64encodedState);

      savedState.nodes = encodedContent;
      encodedState = qs.stringify(savedState);
    } catch (err) {
      this.handleError(err);
    }

    history.push({
      pathname: '/data/graph',
      search: `${encodedState}`,
    });
  }

  @boundMethod
  renderGraphView() {
    const {
      detailPanelRow,
      cache,
      graphData,
    } = this.state;

    const edges = schema.getEdges();
    const expandedEdgeTypes = util.expandEdges(edges);

    if (!graphData) {
      this.loadSavedStateFromURL();
      return (
        <div className="circular-progress">
          <CircularProgress color="secondary" size="4rem" />
        </div>
      );
    }
    return (
      <GraphComponent
        data={graphData || {}}
        cache={cache}
        handleDetailDrawerOpen={this.handleToggleDetailPanel}
        handleDetailDrawerClose={this.handleToggleDetailPanel}
        detail={detailPanelRow}
        handleError={this.handleError}
        edgeTypes={expandedEdgeTypes}
        onRecordClicked={this.handleToggleDetailPanel}
        handleGraphStateSave={this.handleGraphStateSaveIntoURL}
      />
    );
  }

  @boundMethod
  renderDataTable() {
    const {
      cache,
      optionsMenuAnchor,
      search,
      totalRowsSelected,
      totalRows,
    } = this.state;

    const { bufferSize } = this.props;

    return (
      <DataTable
        search={search}
        cache={cache}
        rowBuffer={bufferSize}
        isExportingData={this.handleExportLoader}
        onRecordClicked={this.handleToggleDetailPanel}
        onRecordsSelected={this.handleRecordSelection}
        onRowSelected={this.handleNewRowSelection}
        optionsMenuAnchor={optionsMenuAnchor}
        optionsMenuOnClose={this.handleToggleOptionsMenu}
        totalRows={totalRows}
        totalRowsSelected={totalRowsSelected}
      />
    );
  }

  render() {
    const {
      cache,
      statusMessage,
      totalRows,
      detailPanelRow,
      totalRowsSelected,
      filters,
      filterGroups,
      filterTableOpen,
      filterTableAnchorEl,
      searchType,
      selectedRecords,
    } = this.state;


    const { history } = this.props;
    const URLContainsTable = String(history.location.pathname).includes('table');

    const detailPanelIsOpen = Boolean(detailPanelRow);
    return (
      <div className={
        `data-view ${detailPanelIsOpen
          ? 'data-view--squished'
          : ''}`}
      >
        <div className={`data-view__header${!URLContainsTable ? '--graph-view' : ''}`}>
          {URLContainsTable && (
            <>
              <Typography variant="h5">{searchType} Search</Typography>
              <FilterChips {...filters} />
              {(searchType === 'Advanced') && (
                <>
                  <Tooltip title="click here to see active filter groups">
                    <IconButton
                      onClick={event => this.handleFilterTableToggle(event, 'open')}
                      disabled={!filterGroups}
                    >
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                  {(filterGroups) && (
                    <FilterTablePopover
                      anchorEl={filterTableAnchorEl}
                      filterGroups={filterGroups}
                      handleToggle={event => this.handleFilterTableToggle(event, 'close')}
                      isOpen={filterTableOpen}
                    />
                  )}
                </>
              )}
            </>
          )}
          {URLContainsTable && (
            <Tooltip title="click here for table and export options">
              <IconButton onClick={this.handleToggleOptionsMenu} className="data-view__edit-filters">
                <MoreHorizIcon color="action" />
              </IconButton>
            </Tooltip>
          )}
        </div>
        <div className={`data-view__content${!URLContainsTable ? '--graph-view' : ''}`}>
          {cache && (
            <>
              {URLContainsTable
                ? this.renderDataTable()
                : this.renderGraphView()}
              <DetailDrawer
                node={detailPanelRow}
                onClose={this.handleToggleDetailPanel}
              />
            </>
          )}
        </div>
        <div className="data-view__footer">
          <div className="footer__selected-records">
            {URLContainsTable && (
              <>
                <Typography variant="body2">
                  {totalRowsSelected} Record{totalRowsSelected !== 1 ? 's' : ''} Selected
                </Typography>
                <Tooltip title="click here for graph view">
                  <IconButton
                    onClick={this.handleSwapToGraph}
                    disabled={selectedRecords.length === 0}
                  >
                    <TimelineIcon
                      color={selectedRecords.length === 0 ? 'disabled' : 'secondary'}
                    />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </div>
          {statusMessage && (
            <div className="footer__loader">
              <CircularProgress />
              <Typography variant="body2">
                {statusMessage}
              </Typography>
            </div>
          )}
          {URLContainsTable && (
            <Typography className="footer__total-rows" variant="body2">
            Total Rows: {totalRows === undefined ? 'Unknown' : totalRows}
            </Typography>
          )}
        </div>

      </div>
    );
  }
}

export default DataView;
