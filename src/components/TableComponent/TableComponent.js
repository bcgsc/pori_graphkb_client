/**
 * @module /components/TableComponent
 */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './TableComponent.css';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TableSortLabel,
  IconButton,
  Collapse,
  FormControlLabel,
  Typography,
  RadioGroup,
  Radio,
  Checkbox,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  Popover,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import TimelineIcon from '@material-ui/icons/Timeline';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import FilterIcon from '../FilterIcon/FilterIcon';
import NodeDetailComponent from '../NodeDetailComponent/NodeDetailComponent';
import DownloadFileComponent from '../DownloadFileComponent/DownloadFileComponent';
import util from '../../services/util';
import config from '../../config.json';

const NEXT_CUTOFF = 0.8;
const { ROWS_PER_PAGE, TSV_FILENAME } = config.TABLE_PROPERTIES;
const DEFAULT_COLUMN_ORDER = [
  '@class',
  'source',
  'sourceId',
  'name',
];

/**
 * Component to display query results in table form. Controls state for
 * ellipsis menu, table rows/columns, and table paginator.
 */
class TableComponent extends Component {
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

    this.clearFilter = this.clearFilter.bind(this);
    this.clearFilters = this.clearFilters.bind(this);
    this.createTSV = this.createTSV.bind(this);
    this.openFilter = this.openFilter.bind(this);
    this.setRef = this.setRef.bind(this);
    this.handleFilterStrings = this.handleFilterStrings.bind(this);
    this.handleFilterExclusions = this.handleFilterExclusions.bind(this);
    this.handleChangePage = this.handleChangePage.bind(this);
    this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleColumnCheck = this.handleColumnCheck.bind(this);
    this.handleColumnClose = this.handleColumnClose.bind(this);
    this.handleColumnOpen = this.handleColumnOpen.bind(this);
    this.handleDetailToggle = this.handleDetailToggle.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleRequestSort = this.handleRequestSort.bind(this);
    this.handleSortByChange = this.handleSortByChange.bind(this);
    this.handleSortByChecked = this.handleSortByChecked.bind(this);
    this.handleFilterCheckAll = this.handleFilterCheckAll.bind(this);
  }

  /**
   * React componentDidMount lifecycle
   *
   * Initializes table columns.
   */
  componentDidMount() {
    const { allProps } = this.props;
    const tableColumns = allProps.reduce((r, column) => {
      const [key, nested] = column.split('.');
      if (column.startsWith('in_') || column.startsWith('out_') || column === '@rid') return r;
      if (!column.includes('.')) {
        r.push({
          id: column,
          label: util.antiCamelCase(column),
          checked: column === 'name' || column === 'sourceId',
          sortBy: null,
          sortable: null,
        });
      } else if (nested !== 'source') {
        const col = r.find(c => c.id === key);
        if (!col) {
          r.push({
            id: key,
            label: util.antiCamelCase(key),
            checked: key === 'source',
            sortBy: nested,
            sortable: [nested],
          });
        } else {
          col.sortable.push(nested);
        }
      }
      return r;
    }, []);
    const columnFilterStrings = [];
    const columnFilterExclusions = [];
    for (let i = 0; i < tableColumns.length; i += 1) {
      columnFilterStrings.push('');
      columnFilterExclusions.push([]);
    }

    // Set default order for columns.
    tableColumns.sort((a, b) => {
      if (DEFAULT_COLUMN_ORDER.indexOf(b.id) === -1) {
        return -1;
      }
      if (DEFAULT_COLUMN_ORDER.indexOf(a.id) === -1) {
        return 1;
      }
      if (DEFAULT_COLUMN_ORDER.indexOf(a.id) < DEFAULT_COLUMN_ORDER.indexOf(b.id)) {
        return -1;
      }
      return 1;
    });

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
      const s = sort || (() => 1);
      return { sortedData: Object.values(props.data).sort(s) };
    }
    return null;
  }


  /**
   * Stores DOM references in component state.
   */
  setRef(node, i) {
    const { tableHeadRefs } = this.state;
    if (!tableHeadRefs[i]) {
      /* eslint-disable-next-line react/no-find-dom-node */
      tableHeadRefs[i] = ReactDOM.findDOMNode(node);
      this.setState({ tableHeadRefs });
    }
  }

  clearFilter(i) {
    const { columnFilterStrings, columnFilterExclusions } = this.state;
    columnFilterStrings[i] = '';
    columnFilterExclusions[i] = [];
    this.setState({ columnFilterStrings, columnFilterExclusions });
  }

  /**
   * Sets all filter strings to the empty string.
   */
  clearFilters() {
    const { tableColumns } = this.state;
    for (let i = 0; i < tableColumns.length; i += 1) {
      this.clearFilter(i);
    }
  }

  /**
   * builds tsv data and prompts the browser to download file.
   * @param {Array} fData - forced data to be put into tsv.
   */
  createTSV(fData) {
    const { data, hidden, allProps } = this.props;
    const rows = [];
    const rids = fData || Object.keys(data);
    rows.push(allProps.map(column => util.getEdgeLabel(column)).join('\t'));
    rids.forEach((rid) => {
      const row = [];
      if (!hidden.includes(rid)) {
        allProps.forEach((column) => {
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
  openFilter(i) {
    const { tableHeadRefs, tableColumns, sortedData } = this.state;
    const filterOptions = Object.values(sortedData).reduce((array, datum) => {
      const column = tableColumns[i];
      let value = datum[column.id] || 'null';
      if (value && value !== 'null' && column.sortBy) {
        value = value[column.sortBy];
      }
      if (!array.includes(value)) {
        array.push(value);
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
   * Updates currently editing filter string.
   * @param {Event} e - User input event.
   */
  handleFilterStrings(e) {
    const { columnFilterStrings, tempFilterIndex } = this.state;
    columnFilterStrings[tempFilterIndex] = e.target.value;
    this.setState({ columnFilterStrings });
  }

  /**
   * Updates page to display.
   * @param {Event} e - Triggered event.
   * @param {number} page - New page number.
   */
  handleChangePage(e, page) {
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
   * Updates page rows per page property.
   * @param {Event} event - Rows per page change event.
   */
  handleChangeRowsPerPage(event) {
    this.setState({ rowsPerPage: event.target.value });
  }

  /**
   * Closes table actions menu.
   */
  handleClose() {
    this.setState({ anchorEl: null });
  }

  /**
   * Selects/deselects a column for displaying on the table.
   * @param {number} i - Table column index.
   */
  handleColumnCheck(i) {
    const { tableColumns } = this.state;
    tableColumns[i].checked = !tableColumns[i].checked;
    this.clearFilters();
    this.setState({ tableColumns });
  }

  /**
   * Closes column selection dialog.
   */
  handleColumnClose() {
    this.setState({ columnSelect: false });
  }

  /**
   * Opens column selection dialog.
   */
  handleColumnOpen() {
    this.setState({ columnSelect: true });
  }

  /**
   * Expands row of input node to view details. If node is already expanded,
   * collapses it.
   * @param {string} rid - Node identifier.
   */
  handleDetailToggle(rid) {
    const { toggle } = this.state;
    if (toggle === rid) this.setState({ toggle: '' });
    else {
      this.setState({ toggle: rid });
    }
  }

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

  handleFilterCheckAll(options) {
    const { columnFilterExclusions, tempFilterIndex } = this.state;
    if (columnFilterExclusions[tempFilterIndex].length === 0) {
      columnFilterExclusions[tempFilterIndex] = options.slice();
    } else {
      columnFilterExclusions[tempFilterIndex] = [];
    }
    this.setState({ columnFilterExclusions });
  }

  /**
   * Opens table actions menu.
   * @param {Event} e - Open menu button event.
   */
  handleOpen(e) {
    this.setState({ anchorEl: e.currentTarget });
  }

  /**
   * Sorts table by the input property, if property is already
   * selected, toggles the sort direction.
   * @param {string} column - Column property object to be sorted by.
   */
  handleRequestSort(column) {
    const { orderBy, order } = this.state;
    const { data } = this.props;

    let newOrder = 'desc';
    const newProperty = (order !== 'asc' || orderBy !== column.id) && column.id;
    if (orderBy === column.id && order === 'desc') {
      newOrder = 'asc';
    }

    const sort = (a, b) => {
      if (!newProperty) return 1;
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

    this.setState(
      {
        order: newOrder,
        orderBy: newProperty,
        sortedData: Object.keys(data).map(k => data[k]).sort(sort),
      },
    );
  }

  render() {
    const {
      rowsPerPage,
      page,
      orderBy,
      order,
      sortedData,
      toggle,
      anchorEl,
      columnSelect,
      tableColumns,
      filterPopoverNode,
      tempFilterIndex,
      columnFilterStrings,
      columnFilterExclusions,
      filterOptions,
    } = this.state;

    const {
      data,
      handleCheckAll,
      displayed,
      handleNodeEditStart,
      handleClick,
      handleCheckbox,
      hidden,
      handleShowAllNodes,
      handleHideSelected,
      handleNewQuery,
      handleGraphRedirect,
      handleSubsequentPagination,
      moreResults,
      completedNext,
    } = this.props;

    const numCols = tableColumns.filter(c => c.checked).length;
    const filteredData = sortedData
      .filter(n => !hidden.includes(n['@rid']))
      .filter(n => !columnFilterExclusions.some((exclusions, i) => {
        let cell = n[tableColumns[i].id] === undefined
          || n[tableColumns[i].id] === null
          ? 'null' : n[tableColumns[i].id];

        if (cell && cell !== 'null' && tableColumns[i].sortBy) {
          cell = cell[tableColumns[i].sortBy];
        }
        if (Array.isArray(cell)) {
          return false;
        }
        if (exclusions.includes(cell.toString())) {
          return true;
        }
        return false;
      }));
    const pageData = filteredData
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const menu = (
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={this.handleClose}
        MenuListProps={{
          onMouseLeave: this.handleClose,
        }}
      >
        <MenuItem
          onClick={() => { this.handleClose(); this.clearFilters(); }}
          id="clear-filters"
        >
          Clear all filters
        </MenuItem>
        <MenuItem
          onClick={() => { this.handleClose(); handleGraphRedirect(); }}
          disabled={displayed.length === 0}
          id="view-as-graph"
        >
          View selected in Graph
        </MenuItem>
        <DownloadFileComponent
          mediaType="text/tab-separated-values"
          rawFileContent={this.createTSV}
          fileName={TSV_FILENAME}
          id="download-tsv"
        >
          <MenuItem
            onClick={() => { this.handleClose(); }}
            disabled={sortedData.length === 0}
          >
            Download all as TSV
          </MenuItem>
        </DownloadFileComponent>
        <DownloadFileComponent
          mediaType="text/tab-separated-values"
          rawFileContent={() => this.createTSV(displayed)}
          fileName={TSV_FILENAME}
          id="download-tsv"
        >
          <MenuItem
            onClick={() => { this.handleClose(); }}
            disabled={displayed.length === 0}
          >
            Download selected as TSV
          </MenuItem>
        </DownloadFileComponent>
        <MenuItem
          onClick={() => { this.handleClose(); handleHideSelected(); }}
          disabled={displayed.length === 0}
          id="hide-selected"
        >
          Hide selected rows
          {displayed.length !== 0 && ` (${displayed.length})`}
        </MenuItem>
        <MenuItem
          onClick={() => {
            this.handleClose();
            handleShowAllNodes();
            this.handleSortByChecked('desc');
          }}
          disabled={hidden.length === 0}
        >
          Show hidden rows
          {hidden.length !== 0 && ` (${hidden.length})`}
        </MenuItem>
        <MenuItem
          onClick={() => {
            this.handleClose();
            this.handleColumnOpen();
          }}
          id="column-edit"
        >
          Edit visible columns
        </MenuItem>
      </Menu>
    );

    const columnDialog = (
      <Dialog
        open={columnSelect}
        onClose={this.handleColumnClose}
        classes={{ paper: 'column-dialog' }}
      >
        <DialogTitle id="column-dialog-title">
          Select Columns:
        </DialogTitle>
        <DialogContent>
          {tableColumns.map((column, i) => (
            <div key={column.id} id={column.id}>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={column.checked}
                    onChange={() => this.handleColumnCheck(i)}
                    color="primary"
                  />
                )}
                label={column.label}
              />
              {column.sortBy && (
                <div style={{ marginLeft: '32px' }}>
                  <Typography variant="caption">
                    Sort By:
                  </Typography>
                  <RadioGroup
                    onChange={e => this.handleSortByChange(e.target.value, i)}
                    value={column.sortBy}
                    style={{ flexDirection: 'row' }}
                  >
                    {column.sortable.map(sort => (
                      <FormControlLabel
                        disabled={!column.checked}
                        key={sort}
                        value={sort}
                        control={<Radio />}
                        label={util.antiCamelCase(sort)}
                      />
                    ))}
                  </RadioGroup>
                </div>
              )}
              <Divider />
            </div>
          ))}
        </DialogContent>
        <DialogActions id="column-dialog-actions">
          <Button onClick={this.handleColumnClose} color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );

    const filterPopover = (
      <Popover
        anchorEl={filterPopoverNode}
        open={!!filterPopoverNode}
        onClose={() => this.setState({ filterPopoverNode: null })}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        id="filter-popover"
      >
        <Paper className="paper">
          <List className="filter-list">
            <ListItem dense>
              <TextField
                value={columnFilterStrings[tempFilterIndex]}
                onChange={e => this.handleFilterStrings(e)}
                fullWidth
                margin="none"
                InputProps={{
                  endAdornment: (
                    <InputAdornment><SearchIcon /></InputAdornment>
                  ),
                }}
              />
            </ListItem>
            <List component="div" dense disablePadding className="filter-exclusions-list">
              <ListItem
                button
                onClick={() => this.handleFilterCheckAll(filterOptions)}
                id="select-all-checkbox"
                classes={{
                  root: 'filter-item-background',
                }}
              >
                <Checkbox
                  checked={columnFilterExclusions[tempFilterIndex]
                    && columnFilterExclusions[tempFilterIndex].length === 0
                  }
                />
                <ListItemText>
                  <Typography variant="subheading">
                    {columnFilterExclusions[tempFilterIndex]
                      && columnFilterExclusions[tempFilterIndex].length === 0 ? 'Deselect All' : 'Select All'}
                  </Typography>
                </ListItemText>
              </ListItem>
              {filterOptions
                .sort((o) => {
                  const option = util.castToExist(o);
                  if (option.includes(columnFilterStrings[tempFilterIndex])) return -1;
                  if (option === 'null') return -1;
                  return 1;
                })
                .map((o) => {
                  const option = util.castToExist(o);
                  return (
                    <ListItem
                      dense
                      key={option}
                      button
                      onClick={() => this.handleFilterExclusions(option)}
                    >
                      <Checkbox
                        checked={columnFilterExclusions[tempFilterIndex]
                          && !columnFilterExclusions[tempFilterIndex].includes(option)
                        }
                      />
                      <ListItemText primary={option} />
                    </ListItem>
                  );
                })}
            </List>
          </List>
        </Paper>
      </Popover>
    );
    return (
      <section className="data-table">
        {columnDialog}
        {filterPopover}
        <div className="table-container">
          <Table>
            <TableHead className="table-head">
              <TableRow>
                <TableCell padding="dense">
                  <Checkbox
                    color="secondary"
                    onChange={e => handleCheckAll(e, pageData)}
                  />
                  <TableSortLabel
                    active={orderBy === 'displayed'}
                    onClick={() => this.handleSortByChecked()}
                    direction={order}
                  />
                </TableCell>
                {tableColumns.map((col, i) => {
                  const filterActive = columnFilterExclusions[i].length > 0;
                  if (col.checked) {
                    return (
                      <TableCell
                        key={col.id}
                        padding="dense"
                        ref={node => this.setRef(node, i)}
                      >
                        <TableSortLabel
                          active={col.id === orderBy}
                          onClick={() => this.handleRequestSort(col)}
                          direction={order}
                        >
                          {col.label}
                        </TableSortLabel>
                        <div className="filter-btn">
                          <Tooltip
                            title={filterActive
                              ? 'Ctrl + click to clear'
                              : 'Filter this column'
                            }
                          >
                            <IconButton
                              color={filterActive ? 'secondary' : 'default'}
                              onClick={e => !e.ctrlKey
                                ? this.openFilter(i)
                                : this.clearFilter(i)
                              }
                            >
                              <FilterIcon />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    );
                  }
                  return null;
                })}
                <TableCell style={{ zIndex: 1 }}>
                  <IconButton onClick={this.handleOpen} id="ellipsis-menu">
                    <MoreHorizIcon color="action" />
                  </IconButton>
                  {menu}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageData
                .map((n) => {
                  const isSelected = displayed.includes(n['@rid']);
                  const active = toggle === n['@rid'];
                  const detail = active ? (
                    <TableRow>
                      <Collapse
                        colSpan={numCols + 2}
                        component="td"
                        in={active}
                        unmountOnExit
                      >
                        <NodeDetailComponent
                          node={n}
                          data={data}
                          handleNodeEditStart={handleNodeEditStart}
                          handleNewQuery={handleNewQuery}
                        />
                      </Collapse>
                    </TableRow>
                  ) : null;
                  return !hidden.includes(n['@rid'])
                    && (
                      <React.Fragment key={n['@rid'] || Math.random()}>
                        <TableRow
                          selected={isSelected}
                          onClick={() => handleClick(n['@rid'])}
                          classes={{
                            root: 'cursor-override',
                            selected: 'selected-override',
                          }}
                        >
                          <TableCell padding="dense">
                            <Checkbox
                              onChange={() => handleCheckbox(n['@rid'])}
                              checked={displayed.includes(n['@rid'])}
                            />
                          </TableCell>
                          {tableColumns.map((col) => {
                            if (col.checked) {
                              return (
                                <TableCell key={col.id}>
                                  {col.sortBy ? util.castToExist((n[col.id] || '')[col.sortBy]) : util.castToExist(n[col.id])}
                                </TableCell>
                              );
                            }
                            return null;
                          })}
                          <TableCell>
                            <IconButton
                              onClick={() => this.handleDetailToggle(n['@rid'])}
                              className={`detail-btn ${active ? 'active' : ''}`}
                            >
                              <KeyboardArrowDownIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        {detail}
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
            onChangePage={this.handleChangePage}
            onChangeRowsPerPage={this.handleChangeRowsPerPage}
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
                onClick={handleGraphRedirect}
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

TableComponent.propTypes = {
  /**
   * @param {Object} data - Object containing query results.
   */
  data: PropTypes.object.isRequired,
  /**
   * @param {Array} displayed - Array of displayed nodes.
   */
  displayed: PropTypes.array.isRequired,
  /**
   * @param {function} handleCheckAll - Method triggered when all rows are
   * checked.
   */
  handleCheckAll: PropTypes.func.isRequired,
  /**
   * @param {function} handleNodeEditStart - Method triggered when user
   * requests to edit a node.
   */
  handleNodeEditStart: PropTypes.func.isRequired,
  /**
   * @param {function} handleClick - Method triggered when a row is clicked.
   */
  handleClick: PropTypes.func.isRequired,
  /**
   * @param {function} handleCheckbox - Method triggered when a single row is
   * checked.
   */
  handleCheckbox: PropTypes.func.isRequired,
  /**
   * @param {function} handleHideSelected - Method for hiding selected rows
   * from the view.
   */
  handleHideSelected: PropTypes.func.isRequired,
  /**
   * @param {function} handleShowAllNodes - Method for returning previously
   * hidden rows to the view.
   */
  handleShowAllNodes: PropTypes.func.isRequired,
  /**
   * @param {function} handleNewQuery - Handles new querying with new
   * parameters.
   */
  handleNewQuery: PropTypes.func,
  /**
   * @param {function} handleGraphRedirect - Handles routing to graph
   * component.
   */
  handleGraphRedirect: PropTypes.func.isRequired,
  /**
   * @param {function} handleSubsequentPagination - parent function to handle
   * subsequent api calls.
   */
  handleSubsequentPagination: PropTypes.func,
  /**
   * @param {Array} hidden - Array of hidden nodes.
   */
  hidden: PropTypes.array,
  /**
   * @param {Array} allProps - all non-base columns represented throughout the
   * query results.
   */
  allProps: PropTypes.array,
  /**
   * @param {boolean} moreResults - Flag to tell component there could be more
   * results to the query.
   */
  moreResults: PropTypes.bool,
  /**
   * @param {boolean} completedNext - Flag for whether or not component has
   * completed the current subsequent query.
   */
  completedNext: PropTypes.bool.isRequired,
};

TableComponent.defaultProps = {
  allProps: [],
  hidden: [],
  handleNewQuery: null,
  handleSubsequentPagination: null,
  moreResults: false,
};

export default TableComponent;
