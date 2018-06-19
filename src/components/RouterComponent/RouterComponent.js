import React, { Component } from 'react';
import { BrowserRouter, Link, Route } from 'react-router-dom';
import queryString from 'query-string'


class RouterComponent extends Component {

    render() {
        return (
            <BrowserRouter>
                <App />
            </BrowserRouter >
        )
    }
}
const App = () => (
    <div>
        <nav>
            <Link
                to={{
                    pathname: "/dashboard",
                    search: "?type=a dashboard"
                }}>Dashboard</Link>
            <Link to={"/odashboard"}>Other Dashboard</Link>
        </nav>
        <div>
            <Route path="/dashboard" component={Dashboard} />
        </div>
        <div>
            <Route path="/odashboard" component={OtherDashboard} />
        </div>
    </div>
)

class Dashboard extends Component {
    render() {
        return (
            <div>
                <h1>DASHBOARD!! {this.props.location.search}</h1>
                <h2> {queryString.parse(this.props.location.search).type}</h2>
            </div>
        )
    }
}
const OtherDashboard = () => (
    <div>
        <h1>I'm another dashboard </h1>
        <nav>
            <Link
                to={{
                    pathname: "/odashboard/nested-dashboard",
                }}>nested dashboard</Link>
        </nav>
        <Route path="/odashboard/nested-dashboard" component={NestedDashboard}/>
    </div>
)

const NestedDashboard = () =>(
    <h2> I'm a nested dashboard </h2>
)

export default RouterComponent;