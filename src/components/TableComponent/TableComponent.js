import React, { Component } from "react";
import "./TableComponent.css";
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
  Typography,
  Button,
  Checkbox
} from "@material-ui/core";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import TimelineIcon from "@material-ui/icons/Timeline";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import NodeDetailComponent from "../NodeDetailComponent/NodeDetailComponent";
import { BrowserRouter, Link, Route } from "react-router-dom";

class TableComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: Object.keys(this.props.data).map(rid => this.props.data[rid]),
      page: 0,
      rowsPerPage: 50,
      order: "asc",
      orderBy: null,
      toggle: "",
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
    const orderBy = property;
    let order = "desc";

    if (this.state.orderBy === property && this.state.order === "desc") {
      order = "asc";
    }

    const sort = (a, b) => {
      if (orderBy !== "displayed") {
        return order === "desc"
          ? b[orderBy] < a[orderBy]
            ? -1
            : 1
          : a[orderBy] < b[orderBy]
            ? -1
            : 1;
      } else {
        return order === "desc"
          ? this.props.displayed.includes(b["@rid"]) <
            this.props.displayed.includes(a["@rid"])
            ? -1
            : 1
          : this.props.displayed.includes(a["@rid"]) <
            this.props.displayed.includes(b["@rid"])
            ? -1
            : 1;
      }
    };

    this.setState({ order, orderBy, sort });
  }
  handleDetailToggle(rid) {
    if (this.state.toggle === rid) rid = "";
    this.setState({ toggle: rid });
  }

  isSelected = rid => this.props.selectedId === rid;

  render() {
    const { rowsPerPage, page, orderBy, order, sort } = this.state;
    let data = Object.keys(this.props.data).map(rid => this.props.data[rid])
    if(sort !== null) data = data.sort((a,b) => sort(a,b));
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
      }
    ];

    return (
      <section className="data-table">
        <Table>
          <TableHead className="table-head">
            <TableRow>
              <TableCell>
                <Checkbox
                  onChange={this.props.handleCheckAll}
                  checked={this.props.displayed.length === data.length}
                />
                <TableSortLabel
                  active={orderBy === "displayed"}
                  onClick={e => this.handleRequestSort("displayed")}
                  direction={order}
                />
              </TableCell>
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
              <TableCell style={{ zIndex: 1 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(n => {
                const isSelected = this.isSelected(n["@rid"]);
                let active = this.state.toggle === n["@rid"];
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
                        data={this.props.data}
                        handleNodeEditStart={this.props.handleNodeEditStart}
                      />
                    </Collapse>
                  </TableRow>
                ) : null;
                return (
                  <React.Fragment key={n["@rid"]}>
                    <TableRow
                      selected={isSelected}
                      onClick={e => this.props.handleClick(n["@rid"])}
                      classes={{
                        root: "cursor-override",
                        selected: "selected-override"
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          onChange={e => {
                            this.props.handleCheckbox(n["@rid"]);
                          }}
                          checked={this.props.displayed.includes(n["@rid"])}
                        />
                      </TableCell>
                      <TableCell
                        classes={{
                          root: "source-col"
                        }}
                      >
                        {n.source.name}
                      </TableCell>
                      <TableCell
                        classes={{
                          root: "sourceId-col"
                        }}
                      >
                        {n.sourceId}
                      </TableCell>

                      <TableCell
                        classes={{
                          root: "name-col"
                        }}
                      >
                        {n.name}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => this.handleDetailToggle(n["@rid"])}
                          className={
                            active ? "detail-btn-active" : "detail-btn"
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
                  classes={{ root: "table-paginator" }}
                  count={data.length}
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
                    pathname: "/data/graph",
                    search: this.props.search
                  }}
                >
                  <IconButton
                    color="secondary"
                    style={{ backgroundColor: "rgba(0, 137, 123, 0.1)" }}
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
export default TableComponent;
