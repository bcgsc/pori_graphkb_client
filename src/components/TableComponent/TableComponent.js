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
import DownloadFileComponent from '../DownloadFileComponent/DownloadFileComponent';
import util from '../../services/util';

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
      anchorEl: null,
      graphRedirect: false,
      sortedData: Object.keys(props.data).map(key => props.data[key]),
    };
    this.handleDetailToggle = this.handleDetailToggle.bind(this);
    this.handleRequestSort = this.handleRequestSort.bind(this);
    this.handleChangePage = this.handleChangePage.bind(this);
    this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleGraphRedirect = this.handleGraphRedirect.bind(this);
    this.createTSV = this.createTSV.bind(this);
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
   * @param {string} fOrder - Optional forced order for the sort.
   */
  handleRequestSort(property, fOrder) {
    const { orderBy, order } = this.state;
    const { displayed, data } = this.props;

    let newOrder = fOrder || 'desc';
    const newProperty = order === 'asc' && orderBy === property && !fOrder ? null : property;
    if (orderBy === property && order === 'desc' && !fOrder) {
      newOrder = 'asc';
    }

    const sort = (a, b) => {
      if (!newProperty) return 1;
      if (newProperty !== 'displayed') {
        const aValue = newProperty === 'source' ? a[newProperty].name : a[newProperty];
        const bValue = newProperty === 'source' ? b[newProperty].name : b[newProperty];

        if (newOrder === 'desc') {
          return bValue < aValue
            ? -1
            : 1;
        }
        return bValue > aValue
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

    this.setState(
      {
        order: newOrder,
        orderBy: newProperty,
        sortedData: Object.keys(data).map(k => data[k]).sort(sort),
      },
    );
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
  createTSV() {
    const { data, hidden, allColumns } = this.props;
    const rows = [];
    rows.push(allColumns.map(column => util.getEdgeLabel(column)).join('\t'));

    Object.keys(data).forEach((rid) => {
      const row = [];
      if (!hidden.includes(rid)) {
        allColumns.forEach((column) => {
          row.push(util.getTSVRepresentation(data[rid][column], column));
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

  render() {
    const {
      rowsPerPage,
      page,
      orderBy,
      order,
      sortedData,
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
      hidden,
      handleShowAllNodes,
      handleHideSelected,
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
        MenuListProps={{
          onMouseLeave: this.handleClose,
        }}
      >
        <MenuItem
          onClick={() => { this.handleClose(); this.handleGraphRedirect(); }}
          disabled={displayed.length === 0}
          id="view-as-graph"
        >
          View selected as graph
        </MenuItem>
        <DownloadFileComponent
          mediaType="text/tab-separated-values"
          rawFileContent={this.createTSV()}
          fileName="download.tsv"
          id="download-tsv"
        >
          <MenuItem
            onClick={() => { this.handleClose(); }}
            disabled={sortedData.length === 0}
          >
            Download as TSV
          </MenuItem>
        </DownloadFileComponent>
        <MenuItem
          onClick={() => { this.handleClose(); handleHideSelected(); }}
          disabled={displayed.length === 0}
          id="hide-selected"
        >
          Hide Selected Rows
          {displayed.length !== 0 ? ` (${displayed.length})` : null}
        </MenuItem>
        <MenuItem
          onClick={() => {
            this.handleClose();
            handleShowAllNodes();
            this.handleRequestSort('displayed', 'desc');
          }}
          disabled={hidden.length === 0}
        >
          Show hidden rows
          {hidden.length !== 0 ? ` (${hidden.length})` : null}
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
                  checked={displayed.length === sortedData.length - hidden.length}
                />
                <TableSortLabel
                  active={orderBy === 'displayed'}
                  onClick={() => this.handleRequestSort('displayed')}
                  direction={order}
                >
                  Selected
                </TableSortLabel>
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
                <IconButton onClick={this.handleOpen} id="ellipsis-menu">
                  <MoreHorizIcon color="action" />
                </IconButton>
                {menu}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData
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
                return !hidden.includes(n['@rid'])
                  ? (
                    <React.Fragment key={n['@rid'] || Math.random()}>
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
                  ) : null;
              })
            }
            <TableRow>
              <TableCell colSpan={4} className="spacer-cell">
                <TablePagination
                  classes={{ root: 'table-paginator' }}
                  count={sortedData.length - hidden.length}
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
* @param {Array} hidden - Array of hidden nodes.
* @param {string} search - URL search string.
* @param {string} selectedId - Selected node identifier.
* @param {function} handleCheckAll - Method triggered when all rows are checked.
* @param {function} handleNodeEditStart - Method triggered when user requests to edit a node.
* @param {function} handleClick - Method triggered when a row is clicked.
* @param {function} handleCheckbox - Method triggered when a single row is checked.
* @param {function} handleHideSelected - Method for hiding selected rows from the view.
* @param {function} handleShowAllNodes - Method for returning previously hidden rows to the view.
* @param {Array} allColumns - all non-base columns represented throughout the query results.
    */
TableComponent.propTypes = {
  data: PropTypes.object.isRequired,
  displayed: PropTypes.array.isRequired,
  search: PropTypes.string.isRequired,
  selectedId: PropTypes.string,
  handleCheckAll: PropTypes.func.isRequired,
  handleNodeEditStart: PropTypes.func.isRequired,
  handleClick: PropTypes.func.isRequired,
  handleCheckbox: PropTypes.func.isRequired,
  handleHideSelected: PropTypes.func.isRequired,
  handleShowAllNodes: PropTypes.func.isRequired,
  hidden: PropTypes.array,
  allColumns: PropTypes.array,
};

TableComponent.defaultProps = {
  selectedId: null,
  allColumns: [],
  hidden: [],
};

export default TableComponent;
