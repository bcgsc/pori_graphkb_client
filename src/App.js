import React, { Component } from "react";
import "./App.css";
import QueryView from "./views/QueryView/QueryView";
import AdvancedQueryView from "./views/AdvancedQueryView/AdvancedQueryView";
import AddNodeView from "./views/AddNodeView/AddNodeView";
import DataView from "./views/DataView/DataView";
import ErrorView from "./views/ErrorView/ErrorView";
import NodeFormComponent from "./components/NodeFormComponent/NodeFormComponent";
import AppBar from "@material-ui/core/AppBar";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import TimelineIcon from "@material-ui/icons/Timeline";
import MenuIcon from "@material-ui/icons/Menu";
import SearchIcon from "@material-ui/icons/Search";
import ViewListIcon from "@material-ui/icons/ViewList";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import AddIcon from "@material-ui/icons/Add";
import { BrowserRouter, Link, Route, Redirect, Switch } from "react-router-dom";
import {
  createMuiTheme,
  MuiThemeProvider,
  IconButton
} from "@material-ui/core";
import LoginView from "./views/LoginView/LoginView";
import auth from "./services/auth";

class App extends Component {
  state = {
    open: false
  };

  handleDrawerOpen = () => {
    this.setState({ open: true });
  };

  handleDrawerClose = () => {
    this.setState({ open: false });
  };

  render() {
    const drawer = (
      <Drawer
        anchor="left"
        open={this.state.open}
        variant="temporary"
        classes={{
          paper: "sidebar"
        }}
        onClose={this.handleDrawerClose}
      >
        <div className="nav-drawer" onClick={this.handleDrawerClose}>
          <div className="close-button">
            <IconButton onClick={this.handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </div>

          <Divider />
          <Link className="link" to={"/login"}>
            Login
          </Link>
          <Link className="link" to={"/query"}>
            Query
          </Link>
          <Link className="link" to={"/add"}>
            Add Node
          </Link>
        </div>
      </Drawer>
    );
    const addNodeForm = () => <NodeFormComponent variant="add" />;
    const loggedInContent = (
      <React.Fragment>
        <Route exact path="/">
          <Redirect to="/query" />
        </Route>
        <Route exact path="/query" component={QueryView} />
        <Route path="/query/advanced" component={AdvancedQueryView} />
        <Route path="/add" component={addNodeForm} />
        <Route path="/data" component={DataView} />
        <Route path="/error" component={ErrorView} />
      </React.Fragment>
    );
    return (
      <MuiThemeProvider theme={theme}>
        <BrowserRouter>
          <div className="App">
            <AppBar position="static" className="banner">
              <IconButton color="inherit" aria-label="open drawer">
                <Link className="icon-link" to={"/query"}>
                  <SearchIcon />
                </Link>
              </IconButton>
              <IconButton color="inherit" aria-label="open drawer">
                <Link className="icon-link" to={"/add"}>
                  <AddIcon />
                </Link>
              </IconButton>
              {/* <IconButton
              // color="inherit"
              // aria-label="open drawer"
              // onClick={this.handleDrawerOpen}
              >
                <Link
                  className="icon-link"
                  to={
                    "/data/table?name=disease&ancestors=subclassof&neighbors=3"
                  }
                >
                  <ViewListIcon color="secondary" />
                </Link>
              </IconButton>
              <IconButton color="inherit">
                <Link
                  className="icon-link"
                  to={"/data/graph?name=disease&neighbors=3"}
                >
                  <TimelineIcon color="secondary" />
                </Link>
              </IconButton> */}
            </AppBar>
            {drawer}
            <section className="content">
              <div className="router-outlet">
                <Switch>
                  <Route path="/login" component={LoginView} />
                  <Route
                    path="/"
                    render={props =>
                      !auth.getToken() ? (
                        <Redirect to="/login" />
                      ) : (
                        loggedInContent
                      )
                    }
                  />
                </Switch>
              </div>
            </section>
          </div>
        </BrowserRouter>
      </MuiThemeProvider>
    );
  }
}

const theme = createMuiTheme({
  direction: "ltr",
  palette: {
    primary: {
      main: "#1F2B65"
    },
    secondary: {
      light: "#009688",
      main: "#00897b"
    },
    warn: {
      main: "#d32f2f"
    }
  }
});

export default App;
