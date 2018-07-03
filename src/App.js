import React, { Component } from "react";
import { BrowserRouter, Link, Route, Redirect, Switch } from "react-router-dom";
import "./App.css";
import {
  AppBar,
  Drawer,
  Divider,
  createMuiTheme,
  MuiThemeProvider,
  IconButton
} from "@material-ui/core";
import TimelineIcon from "@material-ui/icons/Timeline";
import MenuIcon from "@material-ui/icons/Menu";
import SearchIcon from "@material-ui/icons/Search";
import ViewListIcon from "@material-ui/icons/ViewList";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import AddIcon from "@material-ui/icons/Add";
import QueryView from "./views/QueryView/QueryView";
import AdvancedQueryView from "./views/AdvancedQueryView/AdvancedQueryView";
import AddNodeView from "./views/AddNodeView/AddNodeView";
import DataView from "./views/DataView/DataView";
import ErrorView from "./views/ErrorView/ErrorView";
import NodeFormComponent from "./components/NodeFormComponent/NodeFormComponent";
import LoginView from "./views/LoginView/LoginView";
import auth from "./services/auth";

/**
 * Entry point to application. Handles routing set up as well as defining the app theme.
 */
class App extends Component {
  render() {
    const addNodeForm = () => <NodeFormComponent variant="add" />;

    const loggedInContent = (
      <Switch>
        <Route exact path="/">
          <Redirect to="/query" />
        </Route>
        <Route exact path="/query" component={QueryView} />
        <Route path="/query/advanced" component={AdvancedQueryView} />
        <Route path="/add" component={addNodeForm} />
        <Route path="/data" component={DataView} />
        <Route path="/error" component={ErrorView} />
      </Switch>
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
            </AppBar>
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
