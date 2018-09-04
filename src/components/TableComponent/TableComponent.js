/**
 * @module /components/TableComponent
 */

import React, { Component } from 'react';
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
} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import TimelineIcon from '@material-ui/icons/Timeline';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import AddIcon from '@material-ui/icons/Add';
import OntologyDetailComponent from '../OntologyDetailComponent/OntologyDetailComponent';
import DownloadFileComponent from '../DownloadFileComponent/DownloadFileComponent';
import util from '../../services/util';
import config from '../../config.json';

const NEXT_CUTOFF = 0.8;
const { ROWS_PER_PAGE, TSV_FILENAME } = config.TABLE_PROPERTIES;

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
    };

    this.createTSV = this.createTSV.bind(this);
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
  }

  /**
   * Initializes table columns.
   */
  componentDidMount() {
    const { allProps } = this.props;
    const tableColumns = allProps.reduce((r, column) => {
      if (column.startsWith('in_') || column.startsWith('out_') || column === '@rid') return r;
      if (!column.includes('.')) {
        r.push({
          id: column,
          label: util.antiCamelCase(column),
          checked: column === 'name' || column === 'sourceId',
          sortBy: null,
          sortable: null,
        });
      } else if (column.split('.')[1] !== 'source') {
        const col = r.find(c => c.id === column.split('.')[0]);
        if (!col) {
          r.push({
            id: column.split('.')[0],
            label: util.antiCamelCase(column.split('.')[0]),
            checked: column.split('.')[0] === 'source',
            sortBy: column.split('.')[1],
            sortable: [column.split('.')[1]],
          });
        } else {
          col.sortable.push(column.split('.')[1]);
        }
      }
      return r;
    }, []);

    // Set default order for columns.
    tableColumns.sort((a, b) => {
      if (a.id === 'source') {
        return -1;
      }
      if (a.id === 'sourceId' && b.id !== 'source') {
        return -1;
      }
      if (a.id === 'name' && b.id !== 'source' && b.id !== 'sourceId') {
        return -1;
      }
      return 1;
    });

    this.setState({ tableColumns });
  }

  /**
   * Checks for new arriving data.
   * @param {Object} nextProps - new properties object
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.data) {
      const { sortedData, sort } = this.state;
      if (Object.keys(nextProps.data).length > sortedData.length) {
        const s = sort || (() => 1);
        this.setState({
          sortedData: Object.keys(nextProps.data).map(k => nextProps.data[k]).sort(s),
        });
      }
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
   * Returns true if node identifier is the currently selected id.
   * @param {string} rid - Target node identifier.
   */
  isSelected(rid) {
    const { selectedId } = this.props;
    return selectedId === rid;
  }

  /**
   * Updates page to display.
   * @param {Event} event - Triggered event.
   * @param {number} page - New page number.
   */
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
    const pageData = sortedData
      .filter(n => !hidden.includes(n['@rid']))
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
          onClick={() => { this.handleClose(); handleGraphRedirect(); }}
          disabled={displayed.length === 0}
          id="view-as-graph"
        >
          View selected as graph
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
          Hide Selected Rows
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
          Show Hidden Rows
          {hidden.length !== 0 && ` (${hidden.length})`}
        </MenuItem>
        <MenuItem
          onClick={() => {
            this.handleClose();
            this.handleColumnOpen();
          }}
          id="column-edit"
        >
          Edit Visible Columns
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
    return (
      <section className="data-table">
        {columnDialog}
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
                {tableColumns.map((col) => {
                  if (col.checked) {
                    return (
                      <TableCell key={col.id}>
                        <TableSortLabel
                          active={col.id === orderBy}
                          onClick={() => this.handleRequestSort(col)}
                          direction={order}
                        >
                          {col.label}
                        </TableSortLabel>
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
              {pageData.map((n) => {
                const isSelected = this.isSelected(n['@rid']);
                const active = toggle === n['@rid'];
                const detail = active ? (
                  <TableRow>
                    <Collapse
                      colSpan={numCols + 2}
                      component="td"
                      in={active}
                      unmountOnExit
                    >
                      <OntologyDetailComponent
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
                                {col.sortBy ? (n[col.id] || '')[col.sortBy] : (n[col.id] || '').toString()}
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
            count={sortedData.length - hidden.length}
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
   * @param {string} selectedId - Selected node identifier.
   */
  selectedId: PropTypes.string,
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
  selectedId: null,
  allProps: [],
  hidden: [],
  handleNewQuery: null,
  handleSubsequentPagination: null,
  moreResults: false,
};

export default TableComponent;