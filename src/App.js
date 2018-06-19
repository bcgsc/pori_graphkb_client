import React, { Component } from "react";
import "./App.css";
import QueryComponent from "./components/QueryComponent/QueryComponent";
import AdvancedQueryComponent from "./components/AdvancedQueryComponent/AdvancedQueryComponent";
import AddNodeComponent from "./components/AddNodeComponent/AddNodeComponent";
import BrowseComponent from "./components/BrowseComponent/BrowseComponent";
import DataHubComponent from "./components/DataHubComponent/DataHubComponent";
import ErrorComponent from "./components/ErrorComponent/ErrorComponent";
import AppBar from "@material-ui/core/AppBar";
import Drawer from "@material-ui/core/Drawer";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import Divider from "@material-ui/core/Divider";
import MenuIcon from "@material-ui/icons/Menu";
import { BrowserRouter, Link, Route } from "react-router-dom";
import {
  createMuiTheme,
  MuiThemeProvider,
  IconButton
} from "@material-ui/core";
import EditNodeComponent from "./components/EditNodeComponent/EditNodeComponent";

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
          <Link className="link" to={"/query"}>
            Query
          </Link>
          <Link className="link" to={"/add"}>
            Add Node
          </Link>
          <Link className="link" to={"/browse"}>
            Browse
          </Link>
        </div>
      </Drawer>
    );

    return (
      <MuiThemeProvider theme={theme}>
        <BrowserRouter>
          <div className="App">
            <AppBar position="static" className="banner">
              <IconButton
                className=""
                color="inherit"
                aria-label="open drawer"
                onClick={this.handleDrawerOpen}
              >
                <MenuIcon />
              </IconButton>
              {/* <span>Knowledge Base</span> */}
              <section className="search-bar">
                <div className="search-background" />
              </section>
            </AppBar>
            {drawer}
            <section className="content">
              <div className="router-outlet">
                <Route exact path="/query" component={QueryComponent} />
              </div>
              <div className="router-outlet">
                <Route
                  path="/query/advanced"
                  component={AdvancedQueryComponent}
                />
              </div>
              <div className="router-outlet">
                <Route path="/add" component={AddNodeComponent} />
              </div>
              <div className="router-outlet">
                <Route path="/browse" component={BrowseComponent} />
              </div>
              <div className="router-outlet">
                <Route path="/results" component={DataHubComponent} />
              </div>
              <div className="router-outlet">
                <Route path="/error" component={ErrorComponent} />
              </div>
              <div className="router-outlet">
                <Route path="/edit" component={EditNodeComponent} />
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
