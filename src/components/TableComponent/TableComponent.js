import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
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
  Checkbox,
  Menu,
  MenuItem,
} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import TimelineIcon from '@material-ui/icons/Timeline';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import NodeDetailComponent from '../NodeDetailComponent/NodeDetailComponent';

/**
 * Component to display query results in table form.
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
      sort: null,
      anchorEl: null,
      graphRedirect: false,
    };
    this.handleDetailToggle = this.handleDetailToggle.bind(this);
    this.handleRequestSort = this.handleRequestSort.bind(this);
    this.handleChangePage = this.handleChangePage.bind(this);
    this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleGraphRedirect = this.handleGraphRedirect.bind(this);
    this.handleTSVDownload = this.handleTSVDownload.bind(this);
  }

  /**
   * Updates page to display.
   */
  handleChangePage(event, page) {
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
   * Sorts table by the input property, if property is already
   * selected, toggles the sort direction.
   * @param {string} property - Key of property to be sorted by.
   */
  handleRequestSort(property) {
    const { orderBy, order } = this.state;
    const { displayed } = this.props;

    let newOrder = 'desc';

    if (orderBy === property && order === 'desc') {
      newOrder = 'asc';
    }

    const sort = (a, b) => {
      if (property !== 'displayed') {
        if (newOrder === 'desc') {
          return b[property] < a[property]
            ? -1
            : 1;
        }
        return a[property] < b[property]
          ? -1
          : 1;
      }
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

    this.setState({ order: newOrder, orderBy: property, sort });
  }

  /**
   * Expands row of input node to view details. If node is already expanded, collapses it.
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
   * Closes table actions menu.
   */
  handleClose() {
    this.setState({ anchorEl: null });
  }

  /**
   * Sets the graph redirect flag to true.
   */
  handleGraphRedirect() {
    this.setState({ graphRedirect: true });
  }

  /**
   * builds tsv data and prompts the browser to download file.
   */
  handleTSVDownload() {
    const { data } = this.props;
    const columns = ['name', 'source', 'sourceId', 'longName', 'description', 'subsets'];
    const rows = [];
    rows.push(columns.join('\t'));
    Object.keys(data).forEach((key) => {
      const row = [];

      columns.forEach((column) => {
        if (column === 'source') {
          row.push(data[key][column].name);
        } else if (column === 'subsets' && data[key][column]) {
          row.push(data[key][column].join(', '));
        } else {
          row.push(data[key][column]);
        }
      });

      rows.push(row.join('\t'));
    });
    const tsv = rows.join('\n');

    const uri = `data:text/tab-separated-values,${encodeURIComponent(tsv)}`;

    const link = document.createElement('a');
    link.download = 'download.tsv';
    link.href = uri;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  }

  /**
   * Returns true if node identifier is the currently selected id.
   * @param {string} rid - Target node identifier.
   */
  isSelected(rid) {
    const { selectedId } = this.props;
    return selectedId === rid;
  }

  render() {
    const {
      rowsPerPage,
      page,
      orderBy,
      order,
      sort,
      toggle,
      anchorEl,
      graphRedirect,
    } = this.state;

    const {
      data,
      handleCheckAll,
      displayed,
      handleNodeEditStart,
      handleClick,
      handleCheckbox,
      search,
    } = this.props;

    if (graphRedirect) {
      return (
        <Redirect
          to={{
            pathname: '/data/graph',
            search,
          }}
        />
      );
    }

    let tableData = Object.keys(data).map(rid => data[rid]);

    if (sort !== null) tableData = tableData.sort((a, b) => sort(a, b));

    const columns = [
      {
        id: 'source',
        label: 'Source',
      },
      {
        id: 'sourceId',
        label: 'Source ID',
      },
      {
        id: 'name',
        label: 'Name',
      },
    ];

    const menu = (
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={this.handleClose}
      >
        <MenuItem
          onClick={() => { this.handleGraphRedirect(); this.handleClose(); }}
          disabled={displayed.length === 0}
        >
          View selected as graph
        </MenuItem>
        <MenuItem
          onClick={() => { this.handleTSVDownload(); this.handleClose(); }}
        >
          Download as TSV
        </MenuItem>
        <MenuItem>
          Hide Selected Rows
        </MenuItem>
        <MenuItem>
          Show all rows
        </MenuItem>
      </Menu>
    );

    return (
      <section className="data-table">
        <Table>
          <TableHead className="table-head">
            <TableRow>
              <TableCell>
                <Checkbox
                  onChange={handleCheckAll}
                  checked={displayed.length === tableData.length}
                />
                <TableSortLabel
                  active={orderBy === 'displayed'}
                  onClick={() => this.handleRequestSort('displayed')}
                  direction={order}
                />
              </TableCell>
              {columns.map(col => (
                <TableCell key={col.id} classes={{ root: `${col.id}-col` }}>
                  <TableSortLabel
                    active={col.id === orderBy}
                    onClick={() => this.handleRequestSort(col.id)}
                    direction={order}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell style={{ zIndex: 1 }}>
                <IconButton onClick={this.handleOpen}>
                  <MoreHorizIcon color="action" />
                </IconButton>
                {menu}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((n) => {
                const isSelected = this.isSelected(n['@rid']);
                const active = toggle === n['@rid'];
                const detail = active ? (
                  <TableRow>
                    <Collapse
                      colSpan={5}
                      component="td"
                      in={active}
                      unmountOnExit
                    >
                      <NodeDetailComponent
                        node={n}
                        data={data}
                        handleNodeEditStart={handleNodeEditStart}
                      />
                    </Collapse>
                  </TableRow>
                ) : null;
                return (
                  <React.Fragment key={n['@rid']}>
                    <TableRow
                      selected={isSelected}
                      onClick={() => handleClick(n['@rid'])}
                      classes={{
                        root: 'cursor-override',
                        selected: 'selected-override',
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          onChange={() => handleCheckbox(n['@rid'])}
                          checked={displayed.includes(n['@rid'])}
                        />
                      </TableCell>
                      <TableCell
                        classes={{
                          root: 'source-col',
                        }}
                      >
                        {n.source.name}
                      </TableCell>
                      <TableCell
                        classes={{
                          root: 'sourceId-col',
                        }}
                      >
                        {n.sourceId}
                      </TableCell>

                      <TableCell
                        classes={{
                          root: 'name-col',
                        }}
                      >
                        {n.name}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => this.handleDetailToggle(n['@rid'])}
                          className={
                            active ? 'detail-btn-active' : 'detail-btn'
                          }
                        >
                          <KeyboardArrowDownIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {detail}
                  </React.Fragment>
                );
              })}
            <TableRow>
              <TableCell colSpan={4} className="spacer-cell">
                <TablePagination
                  classes={{ root: 'table-paginator' }}
                  count={tableData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onChangePage={this.handleChangePage}
                  onChangeRowsPerPage={this.handleChangeRowsPerPage}
                  rowsPerPageOptions={[25, 50, 100]}
                  component="div"
                />
              </TableCell>
              <TableCell className="spacer-cell">

                <IconButton
                  color="secondary"
                  style={{ backgroundColor: 'rgba(0, 137, 123, 0.1)' }}
                  disabled={displayed.length === 0}
                >
                  <Link
                    className="icon-link"
                    to={{
                      pathname: '/data/graph',
                      search,
                    }}
                  >
                    <TimelineIcon />
                  </Link>
                </IconButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    );
  }
}

/**
* @param {Object} data - Object containing query results.
* @param {Array} displayed - Array of displayed nodes.
* @param {string} search - URL search string.
* @param {string} selectedId - Selected node identifier.
* @param {function} handleCheckAll - Method triggered when all rows are checked.
* @param {function} handleNodeEditStart - Method triggered when user requests to edit a node.
* @param {function} handleClick - Method triggered when a row is clicked.
* @param {function} handleCheckbox - Method triggered when a single row is checked.
    */
TableComponent.propTypes = {
  data: PropTypes.object.isRequired,
  displayed: PropTypes.array.isRequired,
  search: PropTypes.string.isRequired,
  selectedId: PropTypes.string.isRequired,
  handleCheckAll: PropTypes.func.isRequired,
  handleNodeEditStart: PropTypes.func.isRequired,
  handleClick: PropTypes.func.isRequired,
  handleCheckbox: PropTypes.func.isRequired,
};

export default TableComponent;
