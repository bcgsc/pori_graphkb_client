/**
 * @module /components/TableComponent
 */

import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TableSortLabel,
  IconButton,
  Typography,
  Checkbox,
  Tooltip,
  CircularProgress,
  Fade,
} from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import TimelineIcon from '@material-ui/icons/Timeline';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import AddIcon from '@material-ui/icons/Add';
import SortIcon from '@material-ui/icons/Sort';

import './TableComponent.scss';
import util from '../../../../services/util';
import FilterIcon from '../../../../static/icons/FilterIcon/FilterIcon';
import config from '../../../../static/config';
import DownloadFileComponent from '../DownloadFileComponent';
import FilterPopover from './TableFilterPopover';
import TableColumnDialog from './TableColumnDialog';
import TableMenu from './TableMenu';

const NEXT_CUTOFF = 0.8;
const { ROWS_PER_PAGE, TSV_FILENAME } = config.TABLE_PROPERTIES;
const DEFAULT_COLUMN_ORDER = [
  '@rid',
  '@class',
  'source.name',
  'sourceId',
  'name',
];

/**
 * Component to display query results in table form. Controls state for
 * ellipsis menu, table rows/columns, and table paginator.
 *
 * @property {object} props
 * @property {Object} props.data - Object containing query results.
 * @property {Object} props.detail - Record being displayed in detail view.
 * @property {Array.<string>} props.displayed - Array of displayed node rids.
 * @property {function} props.handleCheckAll - Method triggered when all rows are
 * checked.
 * @property {function} props.handleCheckbox - Method triggered when a single row is
 * checked.
 * @property {function} props.handleHideSelected - Method for hiding selected rows
 * from the view.
 * @property {function} props.handleNodeEditStart - Method triggered when user
 * requests to edit a node.
 * @property {function} props.handleShowAllNodes - Method for returning previously
 * hidden rows to the view.
 * @property {function} props.handleGraphRedirect - Handles routing to graph
 * component.
 * @property {function} props.handleDetailDrawerOpen - Handles opening of detail
 * drawer to a given record.
 * @property {function} props.handleSubsequentPagination - parent function to handle
 * subsequent api calls.
 * @property {Array.<string>} props.hidden - Array of hidden node rids.
 * @property {Array.<string>} props.allProps - all non-base columns represented
 * throughout the query results.
 * @property {boolean} props.moreResults - Flag to tell component there could be more
 * results to the query.
 * @property {boolean} props.completedNext - Flag for whether or not component has
 * completed the current subsequent query.
 * @property {Array.<Object>} props.storedFilters - filters stored for current
 * session. Accessed on component init and stored on navigate to table.
 * @property {Array.<string>} props.defaultOrder - List of columns to display in
 * order.
 * @property {Object} props.schema - Knowledgebase schema object.
 */
class TableComponent extends Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
    detail: PropTypes.object,
    displayed: PropTypes.arrayOf(PropTypes.string),
    handleCheckAll: PropTypes.func.isRequired,
    handleCheckbox: PropTypes.func.isRequired,
    handleHideSelected: PropTypes.func.isRequired,
    handleShowAllNodes: PropTypes.func.isRequired,
    handleGraphRedirect: PropTypes.func.isRequired,
    handleDetailDrawerOpen: PropTypes.func.isRequired,
    handleSubsequentPagination: PropTypes.func,
    hidden: PropTypes.arrayOf(PropTypes.string),
    allProps: PropTypes.arrayOf(PropTypes.string),
    moreResults: PropTypes.bool,
    completedNext: PropTypes.bool,
    storedFilters: PropTypes.array,
    defaultOrder: PropTypes.arrayOf(PropTypes.string),
    schema: PropTypes.object.isRequired,
  };

  static defaultProps = {
    detail: null,
    allProps: [],
    hidden: [],
    storedFilters: [],
    handleSubsequentPagination: null,
    moreResults: false,
    displayed: [],
    defaultOrder: DEFAULT_COLUMN_ORDER,
    completedNext: true,
  };

  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      rowsPerPage: 50,
      order: 'asc',
      orderBy: null,
      toggle: '',
      anchorEl: null,
      sortedData: Object.keys(props.data).map(key => props.data[key]),
      columnSelect: false,
      tableColumns: [],
      tableHeadRefs: [],
      columnFilterStrings: [],
      tempFilterIndex: '',
      columnFilterExclusions: [],
      filterOptions: [],
    };
  }

  /**
   * React componentDidMount lifecycle
   *
   * Initializes table columns.
   */
  componentDidMount() {
    const {
      allProps,
      storedFilters,
      defaultOrder,
    } = this.props;
    const tableColumns = allProps.reduce((currentColumns, column) => {
      const [key, nested] = column.split('.');
      if (key.startsWith('in_') || key.startsWith('out_')) return currentColumns;
      const newColumn = {
        id: key,
        label: util.antiCamelCase(key),
      };
      if (!nested) {
        Object.assign(newColumn, {
          checked: defaultOrder.includes(key),
          sortBy: null,
          sortable: null,
        });
        currentColumns.push(newColumn);
      } else if (nested !== 'source') {
        const col = currentColumns.find(c => c.id === key);
        if (!col) {
          Object.assign(newColumn, {
            checked: defaultOrder.includes(column),
            sortBy: nested,
            sortable: [nested],
          });
          currentColumns.push(newColumn);
        } else {
          col.sortable.push(nested);
          if (defaultOrder.includes(column)) {
            col.checked = true;
            col.sortBy = nested;
          }
        }
      }
      return currentColumns;
    }, []);

    const columnFilterStrings = [];
    let columnFilterExclusions = [];
    for (let i = 0; i < tableColumns.length; i += 1) {
      columnFilterStrings.push('');
      columnFilterExclusions.push([]);
    }
    if (storedFilters && storedFilters.length > 0) {
      columnFilterExclusions = storedFilters;
    }
    // Set default order for columns.
    tableColumns.sort(util.sortFields(defaultOrder.map(d => d.split('.')[0]), 'id'));
    this.setState({ tableColumns, columnFilterStrings, columnFilterExclusions });
  }

  /**
   * React getDerivedStateFromProps lifecycle
   *
   * Checks for new arriving data, and updates table accordingly if necessary.
   * @param {Object} props - new properties object
   * @param {Object} state - current state on update.
   */
  static getDerivedStateFromProps(props, state) {
    const { sortedData, sort } = state;
    if (Object.keys(props.data).length > sortedData.length) {
      if (sort) {
        return { sortedData: Object.values(props.data).sort(sort) };
      }
      return { sortedData: Object.values(props.data) };
    }
    return null;
  }

  /**
   * Lifecycle method for determining whether component re renders.
   * @param {Object} nextProps - Incoming props object.
   * @param {Object} nextState - Incoming state object.
   */
  shouldComponentUpdate(nextProps, nextState) {
    const { sortedData, page } = this.state;
    const nextPageData = this.pageData(nextState.page, nextState.sortedData).map(n => n['@rid']);
    const currPageData = this.pageData(page, sortedData).map(n => n['@rid']);
    return nextPageData.some(n => !currPageData.includes(n))
      || nextState.sortedData.length > sortedData.length
      || (undefined !== nextProps.detail);
  }

  /**
   * Stores DOM references in component state.
   */
  @boundMethod
  setRef(node, i) {
    const { tableHeadRefs } = this.state;
    if (!tableHeadRefs[i]) {
      /* eslint-disable-next-line react/no-find-dom-node */
      tableHeadRefs[i] = ReactDOM.findDOMNode(node);
      this.setState({ tableHeadRefs });
    }
  }

  /**
   * Clears all filter values for specified column.
   * @param {number} i - column index.
   */
  @boundMethod
  clearFilter(i) {
    const { columnFilterStrings, columnFilterExclusions } = this.state;
    columnFilterStrings[i] = '';
    columnFilterExclusions[i] = [];
    this.setState({ columnFilterStrings, columnFilterExclusions });
  }

  /**
   * Sets all filter strings to the empty string.
   */
  @boundMethod
  clearFilters() {
    const { tableColumns } = this.state;
    for (let i = 0; i < tableColumns.length; i += 1) {
      this.clearFilter(i);
    }
  }

  /**
   * builds tsv data and prompts the browser to download file.
   * @param {Array.<Object>} fData - forced data to be put into tsv.
   */
  @boundMethod
  createTSV(fData) {
    const { data, hidden, allProps } = this.props;
    const rows = [];
    const rids = fData || Object.keys(data);
    const tsvColumns = allProps.filter(column => column !== 'preview');
    rows.push(tsvColumns.join('\t'));
    rids.forEach((rid) => {
      const row = [];
      if (!hidden.includes(rid)) {
        tsvColumns.forEach((column) => {
          if (column.includes('.')) {
            row.push(util.getTSVRepresentation(data[rid][column.split('.')[0]], column));
          } else {
            row.push(util.getTSVRepresentation(data[rid][column], column));
          }
        });

        rows.push(row.join('\t'));
      }
    });
    return rows.join('\n');
  }

  /**
   * Opens filter input box at a column header.
   * @param {number} i - column index.
   */
  @boundMethod
  openFilter(i) {
    const { tableHeadRefs, tableColumns } = this.state;
    const { data } = this.props;
    const column = tableColumns[i];
    const filterOptions = Object.values(data).reduce((array, datum) => {
      let value = datum[column.id];
      if (value && column.sortBy) {
        value = value[column.sortBy];
      }
      if (!array.includes(util.castToExist(value))) {
        array.push(util.castToExist(value));
      }
      return array;
    }, []);
    this.setState({
      filterPopoverNode: tableHeadRefs[i],
      tempFilterIndex: i,
      filterOptions,
    });
  }


  /**
   * Parses current page data to be displayed.
   * @param {number} page - page number.
   * @param {Array.<Object>} data - query results data map.
   */
  pageData(page, data) {
    const {
      hidden,
    } = this.props;
    const {
      columnFilterExclusions,
      rowsPerPage,
      tableColumns,
    } = this.state;
    const filteredData = data
      .filter(n => !hidden.includes(n['@rid']))
      .filter(n => !columnFilterExclusions.some((exclusions, i) => {
        let cell = n[tableColumns[i].id] === undefined
          || n[tableColumns[i].id] === null
          ? 'null' : n[tableColumns[i].id];

        if (cell && cell !== 'null' && tableColumns[i].sortBy) {
          cell = cell[tableColumns[i].sortBy];
        }

        if (exclusions.includes(util.castToExist(cell))) {
          return true;
        }
        return false;
      }));
    return filteredData
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }

  /**
   * Updates currently editing filter string.
   * @param {Event} event - User input event.
   */
  @boundMethod
  handleFilterStrings(event) {
    const { columnFilterStrings, tempFilterIndex } = this.state;
    columnFilterStrings[tempFilterIndex] = event.target.value;
    this.setState({ columnFilterStrings });
  }

  /**
   * General state update handler.
   * @param {Event} event - user change event.
   */
  @boundMethod
  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  /**
   * Updates page to display.
   * @param {Event} event - Triggered event.
   * @param {number} page - New page number.
   */
  @boundMethod
  handleChangePage(event, page) {
    const { sortedData, rowsPerPage } = this.state;
    const { moreResults } = this.props;
    const rows = (page + 1) * rowsPerPage;
    if (rows >= NEXT_CUTOFF * sortedData.length && moreResults) {
      const { handleSubsequentPagination } = this.props;
      if (handleSubsequentPagination) {
        handleSubsequentPagination();
      }
    }
    this.setState({ page });
  }

  /**
   * Closes table actions menu.
   */
  @boundMethod
  handleClose() {
    this.setState({ anchorEl: null, filterPopoverNode: null });
  }

  /**
   * Selects/deselects a column for displaying on the table.
   * @param {number} i - Table column index.
   */
  @boundMethod
  handleColumnCheck(i) {
    const { tableColumns } = this.state;
    tableColumns[i].checked = !tableColumns[i].checked;
    this.clearFilters();
    this.setState({ tableColumns });
  }

  /**
   * Expands row of input node to view details. If node is already expanded,
   * collapses it.
   * @param {string} rid - Node identifier.
   */
  @boundMethod
  handleDetailToggle(rid) {
    const { toggle } = this.state;
    this.setState({ toggle: toggle === rid ? '' : rid });
  }

  /**
   * Toggles filtering/not filtering of a certain option in the currently
   * filtering column.
   * @param {string} option - Option to be toggled.
   */
  @boundMethod
  handleFilterExclusions(option) {
    const { columnFilterExclusions, tempFilterIndex } = this.state;
    const i = columnFilterExclusions[tempFilterIndex].indexOf(option);
    if (i !== -1) {
      columnFilterExclusions[tempFilterIndex].splice(i, 1);
    } else {
      columnFilterExclusions[tempFilterIndex].push(option);
    }
    this.setState({ columnFilterExclusions });
  }

  /**
   * Toggles filters from selecting all/deselecting all options.
   */
  @boundMethod
  handleFilterCheckAll() {
    const {
      columnFilterExclusions,
      tempFilterIndex,
      filterOptions,
    } = this.state;
    if (columnFilterExclusions[tempFilterIndex].length === 0) {
      columnFilterExclusions[tempFilterIndex] = filterOptions.slice();
    } else {
      columnFilterExclusions[tempFilterIndex] = [];
    }
    this.setState({ columnFilterExclusions });
  }

  /**
   * Handles mouse enter event on a table column header, setting the state to
   * the header index.
   * @param {number} i - column header index.
   */
  @boundMethod
  handleHeaderMouseEnter(i) {
    this.setState({ hoveringHeader: i });
  }

  /**
   * Handles mouse leaving event on a table column header, clearing the state.
   */
  @boundMethod
  handleHeaderMouseLeave() {
    this.setState({ hoveringHeader: null });
  }

  /**
   * Opens table actions menu.
   * @param {Event} event - Open menu button event.
   */
  @boundMethod
  handleOpen(event) {
    this.setState({ anchorEl: event.currentTarget });
  }

  /**
   * Sorts table by the input property, if property is already
   * selected, toggles the sort direction.
   * @param {string} column - Column property object to be sorted by.
   */
  @boundMethod
  handleRequestSort(column) {
    const { orderBy, order } = this.state;
    const { data } = this.props;

    let newOrder = 'desc';
    const newProperty = (order !== 'asc' || orderBy !== column.id) && column.id;
    if (orderBy === column.id && order === 'desc') {
      newOrder = 'asc';
    }

    const sort = (a, b) => {
      if (!newProperty) return 0;
      const aValue = column.sortBy ? (a[newProperty] || {})[column.sortBy] : a[newProperty];
      const bValue = column.sortBy ? (b[newProperty] || {})[column.sortBy] : b[newProperty];

      if (newOrder === 'desc') {
        return (bValue || '').toString() < (aValue || '').toString()
          ? -1
          : 1;
      }
      return (bValue || '').toString() > (aValue || '').toString()
        ? -1
        : 1;
    };

    this.setState(
      {
        order: newOrder,
        orderBy: newProperty,
        sortedData: Object.keys(data).map(k => data[k]).sort(sort),
        /**
         * React getDerivedStateFromProps passes state as parameter, causing
         * eslint to not recognize this.state.sort s use as a class field.
         */
        /* eslint-disable-next-line */
        sort,
      },
    );
  }

  /**
   * sets a new subproperty to sort by.
   * @param {string} sortBy - new property for column to be sorted by.
   * @param {number} i - column index.
   */
  @boundMethod
  handleSortByChange(sortBy, i) {
    const { tableColumns } = this.state;
    tableColumns[i].sortBy = sortBy;
    this.setState({ tableColumns });
  }

  /**
   * Sorts table by whether or not row is checked. Toggles output order based
   * on current state.
   * @param {string} fOrder - forced output order.
   */
  @boundMethod
  handleSortByChecked(fOrder) {
    const { orderBy, order } = this.state;
    const { displayed, data } = this.props;
    let newOrder = fOrder || 'desc';
    const newProperty = !(order === 'asc' && orderBy === 'displayed' && !fOrder) && 'displayed';
    if (orderBy === 'displayed' && order === 'desc' && !fOrder) {
      newOrder = 'asc';
    }

    const sort = (a, b) => {
      if (!newProperty) return 1;
      if (newOrder === 'desc') {
        return displayed.includes(b['@rid'])
          < displayed.includes(a['@rid'])
          ? -1
          : 1;
      }
      return displayed.includes(a['@rid'])
        < displayed.includes(b['@rid'])
        ? -1
        : 1;
    };

    this.setState({
      order: newOrder,
      orderBy: newProperty,
      sortedData: Object.keys(data).map(k => data[k]).sort(sort),
    });
  }

  render() {
    const {
      rowsPerPage,
      page,
      orderBy,
      order,
      sortedData,
      anchorEl,
      columnSelect,
      tableColumns,
      filterPopoverNode,
      tempFilterIndex,
      columnFilterStrings,
      columnFilterExclusions,
      filterOptions,
      hoveringHeader,
    } = this.state;

    const {
      handleCheckAll,
      displayed,
      handleCheckbox,
      hidden,
      handleShowAllNodes,
      handleHideSelected,
      handleGraphRedirect,
      handleSubsequentPagination,
      handleDetailDrawerOpen,
      moreResults,
      completedNext,
      detail,
      schema,
    } = this.props;

    const filteredData = sortedData
      .filter(n => !hidden.includes(n['@rid']))
      .filter(n => !columnFilterExclusions.some((exclusions, i) => {
        let cell = n[tableColumns[i].id] === undefined
          || n[tableColumns[i].id] === null
          ? 'null' : n[tableColumns[i].id];

        if (cell && cell !== 'null' && tableColumns[i].sortBy) {
          cell = cell[tableColumns[i].sortBy];
        }

        return exclusions.includes(util.castToExist(cell));
      }));

    const pageData = filteredData
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const menu = (
      <TableMenu
        anchorEl={anchorEl}
        items={[
          {
            action: this.clearFilters,
            id: 'clear-filters',
            label: 'Clear all filters',
          },
          {
            action: () => handleGraphRedirect(columnFilterExclusions),
            disabled: displayed.length === 0,
            id: 'view-as-graph',
            label: 'View selected in Graph',
          },
          {
            id: 'download-tsv',
            disabled: sortedData.length === 0,
            label: (
              <DownloadFileComponent
                mediaType="text/tab-separated-values"
                rawFileContent={this.createTSV}
                fileName={TSV_FILENAME}
                id="download-tsv"

              >
                Download all as TSV
              </DownloadFileComponent>
            ),
          },
          {
            id: 'download-selected',
            disabled: displayed.length === 0,
            label: (
              <DownloadFileComponent
                mediaType="text/tab-separated-values"
                rawFileContent={() => this.createTSV(displayed)}
                fileName={TSV_FILENAME}
              >
                Download selected as TSV
              </DownloadFileComponent>
            ),
          },
          {
            action: handleHideSelected,
            disabled: displayed.length === 0,
            id: 'hide-selected',
            label: `Hide selected rows${displayed.length !== 0 && ` (${displayed.length})`}`,
          },
          {
            action: () => { handleShowAllNodes(); this.handleSortByChange('desc'); },
            disabled: hidden.length === 0,
            label: `Show hidden rows${hidden.length !== 0 && ` (${hidden.length})`}`,
          },
          {
            action: () => this.handleChange({ target: { name: 'columnSelect', value: true } }),
            id: 'column-edit',
            label: 'Edit visible columns',
          },
        ]}
        onClose={this.handleClose}
      />
    );

    const columnDialog = (
      <TableColumnDialog
        open={columnSelect}
        handleChange={this.handleChange}
        handleColumnCheck={this.handleColumnCheck}
        handleSortByChange={this.handleSortByChange}
        tableColumns={tableColumns}
      />
    );
    const filterPopover = (
      <FilterPopover
        anchorEl={filterPopoverNode}
        onClose={this.handleClose}
        filterValue={columnFilterStrings[tempFilterIndex]}
        onFilterChange={this.handleFilterStrings}
        onFilterCheckAll={this.handleFilterCheckAll}
        onFilterExclude={this.handleFilterExclusions}
        values={filterOptions || []}
        filtered={columnFilterExclusions[tempFilterIndex] || []}
      />
    );

    return (
      <section className="data-table">
        {columnDialog}
        {filterPopover}
        <div className={`table-container ${detail ? 'table-drawer-open' : ''}`}>
          <Table>
            <TableHead className="table-head">
              <TableRow>
                <TableCell padding="checkbox" className="table-row-checkbox">
                  <Checkbox
                    color="secondary"
                    onChange={e => handleCheckAll(e, pageData)}
                  />
                  <TableSortLabel
                    active={orderBy === 'displayed'}
                    onClick={() => this.handleSortByChecked()}
                    direction={order}
                  >
                    <SortIcon />
                  </TableSortLabel>
                </TableCell>
                {tableColumns.map((col, i) => {
                  const filterActive = (columnFilterExclusions[i] || []).length > 0;
                  if (col.checked) {
                    return (
                      <TableCell
                        key={col.id}
                        padding="dense"
                        ref={node => this.setRef(node, i)}
                        onMouseEnter={() => this.handleHeaderMouseEnter(i)}
                        onMouseLeave={() => this.handleHeaderMouseLeave(i)}
                      >
                        <TableSortLabel
                          active={col.id === orderBy}
                          onClick={() => this.handleRequestSort(col)}
                          direction={order}
                        >
                          {col.label}
                        </TableSortLabel>
                        <Fade
                          in={
                            hoveringHeader === i
                            || filterActive
                            || (filterPopoverNode && tempFilterIndex === i)
                          }
                        >
                          <div className="filter-btn">
                            <Tooltip
                              title={filterActive
                                ? 'Ctrl + click to clear'
                                : 'Filter this column'
                              }
                            >
                              <IconButton
                                color={filterActive ? 'secondary' : 'default'}
                                onClick={(e) => {
                                  if (!e.ctrlKey) {
                                    this.openFilter(i);
                                  } else {
                                    this.clearFilter(i);
                                  }
                                }}
                              >
                                <FilterIcon />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </Fade>
                      </TableCell>
                    );
                  }
                  return null;
                })}
                <TableCell style={{ zIndex: 1 }} padding="checkbox">
                  <IconButton onClick={this.handleOpen} id="ellipsis-menu">
                    <MoreHorizIcon color="action" />
                  </IconButton>
                  {menu}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageData.map((n) => {
                const isSelected = displayed.includes(n['@rid']);
                return !hidden.includes(n['@rid'])
                  && (
                    <React.Fragment key={n['@rid'] || Math.random()}>
                      <TableRow
                        selected={isSelected}
                        onClick={() => handleDetailDrawerOpen(n, true)}
                        classes={{
                          selected: 'selected-override',
                        }}
                      >
                        <TableCell padding="checkbox" className="table-row-checkbox">
                          <Checkbox
                            onClick={e => handleCheckbox(e, n['@rid'])}
                            checked={displayed.includes(n['@rid'])}
                          />
                        </TableCell>
                        {tableColumns.map((col) => {
                          if (col.checked) {
                            let val = util.formatStr(col.sortBy
                              ? util.castToExist((n[col.id] || '')[col.sortBy])
                              : util.castToExist(n[col.id]));

                            if (col.id === 'preview') {
                              try {
                                val = schema.getPreview(n);
                              } catch (e) {
                                val = 'Invalid Variant';
                              }
                            }
                            return (
                              <TableCell classes={{ root: 'cell' }} key={col.id}>
                                {val}
                              </TableCell>
                            );
                          }
                          return null;
                        })}
                        <TableCell padding="checkbox">
                          {detail && detail['@rid'] === n['@rid'] && (
                            <Fade in>
                              <AssignmentIcon color="action" style={{ width: 48 }} />
                            </Fade>
                          )}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="pag">
          <TablePagination
            classes={{ root: 'table-paginator', toolbar: 'paginator-spacing' }}
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            name="rowsPerPage"
            onChangePage={this.handleChangePage}
            onChangeRowsPerPage={e => this.handleChange({ target: { name: 'rowsPerPage', value: e.target.value } })}
            rowsPerPageOptions={ROWS_PER_PAGE}
            component="div"
          />
          <Tooltip
            title="Load more results into table"
            placement="top"
            disableFocusListener
          >
            <div className="more-results-btn">
              <IconButton
                disabled={!moreResults}
                onClick={() => {
                  if (handleSubsequentPagination) {
                    handleSubsequentPagination();
                  }
                }}
              >
                <AddIcon />
              </IconButton>
            </div>
          </Tooltip>
          {!completedNext && (
            <div style={{ display: 'flex', justifyItems: 'center' }}>
              <CircularProgress size={20} color="primary" id="new-data-spinner" />
              <Typography variant="caption" style={{ margin: 'auto' }}>loading more results...</Typography>
            </div>
          )}
          <Tooltip
            title="Select ontologies to display in graph form"
            placement="left"
          >
            <div className="graph-btn">
              <IconButton
                color="secondary"
                disabled={displayed.length === 0}
                onClick={() => handleGraphRedirect(columnFilterExclusions)}
              >
                <TimelineIcon />
              </IconButton>
            </div>
          </Tooltip>
        </div>
      </section>
    );
  }
}

export default TableComponent;