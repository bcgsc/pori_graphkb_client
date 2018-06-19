import React, { Component } from "react";
import "./TableComponent.css";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TableSortLabel
} from "@material-ui/core";

class TableComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: Object.keys(this.props.data).map(rid => this.props.data[rid]),
      page: 0,
      rowsPerPage: 50,
      order: "asc",
      orderBy: null
    };
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };
  handleRequestSort = property => {
    const orderBy = property;
    let order = "desc";

    if (this.state.orderBy === property && this.state.order === "desc") {
      order = "asc";
    }

    const data =
      order === "desc"
        ? this.state.data.sort((a, b) => (b[orderBy] < a[orderBy] ? -1 : 1))
        : this.state.data.sort((a, b) => (a[orderBy] < b[orderBy] ? -1 : 1));

    this.setState({ data, order, orderBy });
    console.log(this.state);
  };

  isSelected = rid => this.props.selectedId === rid;

  render() {
    const data = Object.keys(this.state.data).map(rid => this.state.data[rid]);
    const { rowsPerPage, page, orderBy, order } = this.state;
    const columns = [
      {
        id: "source",
        label: "Source"
      },
      {
        id: "sourceId",
        label: "Source ID"
      },
      {
        id: "name",
        label: "Name"
      },
      {
        id: "subsets",
        label: "Subsets"
      }
    ];

    return (
      <section className="data-table">
        <Table>
          <TableHead className="table-head">
            <TableRow>
              {columns.map(col => {
                return (
                  <TableCell key={col.id} classes={{ root: col.id + "-col" }}>
                    <TableSortLabel
                      active={col.id === orderBy}
                      onClick={e => this.handleRequestSort(col.id)}
                      direction={order}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(n => {
                const isSelected = this.isSelected(n.rid);
                return (
                  <TableRow
                    key={n.rid}
                    selected={isSelected}
                    onClick={e => this.props.handleClick(e, n.rid)}
                    classes={{
                      root: "cursor-override",
                      selected: "selected-override"
                    }}
                  >
                    <TableCell
                      classes={{
                        root: "source-col"
                      }}
                    >
                      {n.source}
                    </TableCell>
                    <TableCell
                      classes={{
                        root: "sourceId-col"
                      }}
                    >
                      {n.sourceId}
                    </TableCell>
                    {/* <TableCell>
                                        {n.createdBy}
                                    </TableCell> */}
                    <TableCell
                      classes={{
                        root: "name-col"
                      }}
                    >
                      {n.name}
                    </TableCell>
                    <TableCell
                      classes={{
                        root: "subsets-col"
                      }}
                    >
                      {n.subsets}
                    </TableCell>
                  </TableRow>
                );
              })}
            <TableRow>
              <TablePagination
                classes={{ root: "table-paginator" }}
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={this.handleChangePage}
                onChangeRowsPerPage={this.handleChangeRowsPerPage}
                rowsPerPageOptions={[25, 50, 100]}
              />
              <TableCell classes={{ root: "spacer-cell" }} />
              <TableCell classes={{ root: "spacer-cell" }} />
              <TableCell classes={{ root: "spacer-cell" }} />
            </TableRow>
          </TableBody>
        </Table>
      </section>
    );
  }
}
export default TableComponent;
