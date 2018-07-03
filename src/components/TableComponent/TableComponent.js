import React, { Component } from 'react';
import { Link } from 'react-router-dom';
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
} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import TimelineIcon from '@material-ui/icons/Timeline';
import NodeDetailComponent from '../NodeDetailComponent/NodeDetailComponent';

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
    };
    this.handleDetailToggle = this.handleDetailToggle.bind(this);
    this.handleRequestSort = this.handleRequestSort.bind(this);
    this.handleChangePage = this.handleChangePage.bind(this);
    this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);
  }

  handleChangePage(event, page) {
    this.setState({ page });
  }

  handleChangeRowsPerPage(event) {
    this.setState({ rowsPerPage: event.target.value });
  }

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

  handleDetailToggle(rid) {
    const { toggle } = this.state;
    if (toggle === rid) this.setState({ toggle: '' });
    else {
      this.setState({ toggle: rid });
    }
  }

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
              <TableCell style={{ zIndex: 1 }} />
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
                <Link
                  className="link"
                  to={{
                    pathname: '/data/graph',
                    search,
                  }}
                >
                  <IconButton
                    color="secondary"
                    style={{ backgroundColor: 'rgba(0, 137, 123, 0.1)' }}
                  >
                    <TimelineIcon />
                  </IconButton>
                </Link>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    );
  }
}

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
