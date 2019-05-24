import React from 'react';
import PropTypes from 'prop-types';
import {
  Chip,
  Typography,
  CircularProgress,
  IconButton,
} from '@material-ui/core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import EditIcon from '@material-ui/icons/Edit';
import { boundMethod } from 'autobind-decorator';


import kbSchema from '@bcgsc/knowledgebase-schema';


import DataTable from './components/DataTable';
import DetailDrawer from './components/DetailDrawer';
import { KBContext } from '../../components/KBContext';
import RecordFormDialog from '../../components/RecordFormDialog';
import api from '../../services/api';
import { cleanLinkedRecords } from '../../components/util';

import './index.scss';

/**
 * Shows the search result filters and an edit button
 */
class DataView extends React.Component {
  static contextType = KBContext;

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
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
      variant: 'table',
      filtersEditOpen: false,
      filters: {},
      search,
    };
    this.controllers = [];
  }

  async componentDidMount() {
    const { schema } = this.context;
    const { cacheBlocks, blockSize } = this.props;
    const cache = api.getNewCache({
      schema,
      cacheBlocks,
      blockSize,
      onLoadCallback: this.handleLoadingChange,
      onErrorCallback: this.handleError,
    });
    const filters = await this.parseFilters(cache);
    this.setState({ cache, filters });
  }

  componentWillUnmount() {
    const { cache } = this.state;
    if (cache) {
      cache.abortAll();
    }
  }

  /**
   * Changes the current filters set and updates the URL to match
   */
  @boundMethod
  handleEditFilters(filters) {
    const { schema } = this.context;
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

  /**
   * Called in response to records being requested or loaded
   * Responsible for giving the user information while waiting for things to load
   */
  @boundMethod
  handleLoadingChange() {
    const { cache, search } = this.state;
    if (!cache) {
      return;
    }
    const rowCount = cache.rowCount(search);
    const [start, end] = cache.pendingRows(search);

    let statusMessage;
    if (start !== null) {
      statusMessage = `requesting ${start} - ${end}`;
      if (rowCount !== undefined) {
        statusMessage = `${statusMessage} of ${rowCount} rows`;
      } else {
        statusMessage = `${statusMessage} rows ....`;
      }
    }
    this.setState({ statusMessage, totalRows: rowCount });
  }

  /**
   * Opens the right-hand panel that shows details of a given record
   */
  @boundMethod
  handleToggleDetailPanel(opt = {}) {
    const { data } = opt;

    if (!data) {
      this.setState({ detailPanelRow: null });
    } else {
      this.setState({ detailPanelRow: data });
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
  handleRecordSelection(selectedRecords) {
    this.setState({ selectedRecords });
  }

  @boundMethod
  handleError(err) {
    const { history } = this.props;
    history.push('/error', { error: { name: err.name, message: err.message } });
  }

  /**
   * If there are any linked records, fetch them now and attach them in place of their reference ID
   */
  async parseFilters(cache) {
    const { search } = this.state;
    const { schema } = this.context;

    try {
      const { queryParams, modelName } = api.getQueryFromSearch({ search, schema });
      const links = [];
      Object.entries(queryParams).forEach(([key, value]) => {
        if (typeof value === 'string' && kbSchema.util.looksLikeRID(value)) {
          links.push({ key, value });
        }
      });

      const records = await cache.getRecords(links.map(l => ({ '@rid': l.value })));
      records.forEach((rec, index) => {
        const { key } = links[index];
        queryParams[key] = rec;
      });

      return { ...queryParams, '@class': modelName };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Draws the chips above the table which show the user the current filters
   */
  renderFilterChips({ limit, neighbors, ...params }, prefix = null) {
    const { schema } = this.context;
    const chips = [];
    Object.entries(params).forEach(([key, param]) => {
      let operator = '=';
      let value = param;

      if (param !== undefined) {
        if (typeof param === 'object' && param !== null && !param['@rid']) {
          chips.push(...this.renderFilterChips(param, key));
        } else {
          if (`${param}`.startsWith('~')) {
            operator = '~';
            value = param.slice(1);
          }
          if (param && param['@rid']) {
            value = schema.getLabel(param);
          }
          const name = prefix
            ? `${prefix}.${key}`
            : key;
          chips.push((
            <Chip
              key={name}
              label={`${name} ${operator} ${value}`}
            />
          ));
        }
      }
    });
    return chips;
  }

  render() {
    const {
      cache,
      statusMessage,
      totalRows,
      detailPanelRow,
      optionsMenuAnchor,
      selectedRecords,
      filtersEditOpen,
      filters,
      search,
      variant,
    } = this.state;
    const { bufferSize } = this.props;

    const detailPanelIsOpen = Boolean(detailPanelRow);

    return (
      <div className={
        `data-view ${detailPanelIsOpen
          ? 'data-view--squished'
          : ''}`}
      >
        <div className="data-view__header">
          {variant === 'table' && (
            <>
              <Typography variant="h3">Active Filters</Typography>
              <IconButton
                onClick={() => this.setState({ filtersEditOpen: true })}
              >
                <EditIcon />
              </IconButton>
              {this.renderFilterChips(filters)}
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
          <IconButton onClick={this.handleToggleOptionsMenu} className="data-view__edit-filters">
            <MoreHorizIcon color="action" />
          </IconButton>
        </div>
        <div className="data-view__content">
          {cache && (
            <>
              <DataTable
                search={search}
                cache={cache}
                rowBuffer={bufferSize}
                onRecordClicked={this.handleToggleDetailPanel}
                onRecordsSelected={this.handleRecordSelection}
                optionsMenuAnchor={optionsMenuAnchor}
                optionsMenuOnClose={this.handleToggleOptionsMenu}
              />
              <DetailDrawer
                node={detailPanelRow}
                onClose={this.handleToggleDetailPanel}
              />
            </>
          )}
        </div>
        <div className="data-view__footer">
          <div className="footer__selected-records">
            <Typography>
              {selectedRecords.length} Record{selectedRecords.length !== 1 ? 's' : ''} Selected
            </Typography>
          </div>
          {statusMessage && (
            <div className="footer__loader">
              <CircularProgress />
              <Typography>
                {statusMessage}
              </Typography>
            </div>
          )}
          <Typography className="footer__total-rows">
            Total Rows: {totalRows === undefined ? 'Unknown' : totalRows}
          </Typography>
        </div>

      </div>
    );
  }
}

export default DataView;
