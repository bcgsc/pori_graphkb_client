import React from 'react';
import PropTypes from 'prop-types';
import {
  Chip,
  Typography,
  CircularProgress,
  IconButton,
} from '@material-ui/core';
import TimelineIcon from '@material-ui/icons/Timeline';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Tooltip from '@material-ui/core/Tooltip';
import FilterListIcon from '@material-ui/icons/FilterList';
import { boundMethod } from 'autobind-decorator';
import * as qs from 'qs';


import kbSchema from '@bcgsc/knowledgebase-schema';

import FilterTablePopover from './components/FilterTablePopover';
import DataTable from './components/DataTable';
import GraphComponent from './components/GraphComponent';
import DetailDrawer from './components/DetailDrawer';
import RecordFormDialog from '../../components/RecordFormDialog';
import api from '../../services/api';
import { cleanLinkedRecords } from '../../components/util';
import { hashRecordsByRID } from './util';
import { HistoryPropType, LocationPropType } from '../../components/types';
import schema from '../../services/schema';

import './index.scss';

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
      filtersEditOpen: false,
      filters: {},
      filterGroups: {},
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
    const filters = await this.parseFilters(cache);
    const { searchType } = filters;
    delete filters.searchType;

    this.setState({ cache, filters, searchType });
  }

  componentWillUnmount() {
    const { cache } = this.state;

    if (cache) {
      cache.abortAll();
    }
  }

  /**
   * If there are any linked records, fetch them now and attach them in place of their reference ID
   */
  async parseFilters(cache) {
    const { search } = this.state;

    try {
      const {
        queryParams, modelName, searchChipProps, searchChipProps: { searchType }, payload,
      } = api.getQueryFromSearch({ search, schema });
      console.log('TCL: DataView -> parseFilters -> searchChipProps', searchChipProps);
      console.log('TCL: DataView -> parseFilters -> payload', payload);

      if (searchType === 'Advanced') {
        const { filters: filterGroups } = payload;
        console.log('TCL: DataView -> parseFilters -> filterGroups', filterGroups);
        this.setState({ filterGroups });
      }

      const links = [];
      Object.entries(queryParams || {}).forEach(([key, value]) => {
        if (typeof value === 'string' && kbSchema.util.looksLikeRID(value)) {
          links.push({ key, value });
        }
      });

      const records = await cache.getRecords(links.map(l => ({ '@rid': l.value })));
      records.forEach((rec, index) => {
        const { key } = links[index];
        queryParams[key] = rec;
      });

      return { '@class': modelName, ...queryParams, ...searchChipProps };
    } catch (err) {
      return this.handleError(err);
    }
  }


  /**
   * Draws the chips above the table which show the user the current filters
   */
  renderFilterChips = (filters) => {
    const {
      limit, neighbors, ...params
    } = filters;

    const chips = [];
    Object.entries(params).forEach(([key, param]) => {
      const operator = '=';
      const isChipProp = key.toLowerCase().includes('chip');
      const label = isChipProp ? param : `${key} ${operator} ${param}`;
      chips.push((
        <Chip
          key={key}
          label={label}
        />
      ));
    });
    return chips;
  };

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

  /**
   * Changes the current filters set and updates the URL to match
   */
  @boundMethod
  handleEditFilters(filters) {
    const { history, location: { pathname } } = this.props;
    // drop all undefined values
    const { routeName } = schema.get(filters);

    try {
      const search = api.getSearchFromQuery({
        schema,
        queryParams: cleanLinkedRecords(filters),
        routeName,
      });
      history.replace(`${pathname}?${search}`);
      this.setState({ filtersEditOpen: false, filters, search: `?${search}` });
    } catch (err) {
      this.handleError(err);
    }
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

  /**
   * Renders either the DataTable or Graph view depending on the parsed URL
   */
  @boundMethod
  renderDataComponent() {
    const {
      detailPanelRow,
      cache,
      graphData,
      optionsMenuAnchor,
      search,
      totalRowsSelected,
      totalRows,
    } = this.state;

    const { bufferSize } = this.props;
    const edges = schema.getEdges();

    const URL = String(window.location.href);
    const isGraphView = URL.includes('node');

    if (isGraphView) {
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
          edgeTypes={edges}
          onRecordClicked={this.handleToggleDetailPanel}
          handleGraphStateSave={this.handleGraphStateSaveIntoURL}
        />
      );
    }
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
      filtersEditOpen,
      filters,
      filterGroups,
      filterTableOpen,
      filterTableAnchorEl,
      searchType,
    } = this.state;
    console.log('TCL: render -> filters', filters);


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
              {this.renderFilterChips(filters)}
              {(searchType === 'Advanced') && (
                <>
                  <Tooltip title="click here to see active filter groups">
                    <IconButton onClick={event => this.handleFilterTableToggle(event, 'open')}>
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                  <FilterTablePopover
                    anchorEl={filterTableAnchorEl}
                    filterGroups={filterGroups}
                    handleToggle={event => this.handleFilterTableToggle(event, 'close')}
                    isOpen={filterTableOpen}
                  />
                </>
              )}
            </>
          )}
          <RecordFormDialog
            isOpen={filtersEditOpen}
            modelName="V"
            onClose={() => this.setState({ filtersEditOpen: false })}
            onError={this.handleError}
            onSubmit={this.handleEditFilters}
            title="Edit Search Filters"
            variant="search"
            value={filters}
          />
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
              {this.renderDataComponent()}
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
                  <IconButton onClick={this.handleSwapToGraph}>
                    <TimelineIcon
                      color="secondary"
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
