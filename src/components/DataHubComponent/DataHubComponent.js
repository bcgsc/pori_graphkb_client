import React, { Component } from 'react';
import './DataHubComponent.css';
import api from '../../services/api';
import prepareEntry from '../../services/serializers';
import NodeDetail from '../NodeDetail/NodeDetail';
import TableComponent from '../TableComponent/TableComponent';
import { Redirect } from 'react-router-dom';
import { Paper } from '@material-ui/core';

class DataHubComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            redirect: false,
            value: 0,
            data: null,
            selectedId: null,
        }

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        let dataMap = {};
        let redirect = false;
        api.get('/diseases' + this.props.location.search).then(data => {

            if (data.length === 0) redirect = true;
            data.forEach(ontologyTerm => {
                let entry = prepareEntry(ontologyTerm);
                dataMap[entry.rid] = entry;
            });

            this.setState({
                data: dataMap,
                selectedId: Object.keys(dataMap)[0],
                redirect: redirect,
            });
        })
    }

    handleChange = (event, value) => {
        this.setState({ value });
    };

    handleClick(e, rid) {
        // alert(rid);
        this.setState({ selectedId: rid });
    }

    render() {
        let dataView = () => {
            if (this.state.redirect) return (<Redirect push to={{ pathname: '/query' }} />);

            if (this.state.data) {
                return (
                    <div className="data-view">
                        <div className="group-view">
                            <Paper className='group-body'>
                                <TableComponent
                                    data={this.state.data}
                                    selectedId={this.state.selectedId}
                                    handleClick={this.handleClick}
                                />
                            </Paper>
                        </div>
                        {/* <Paper className="node-view" elevation={4}>
                            <NodeDetail
                                selectedId={this.state.selectedId}
                                data={this.state.data}
                                handleClick={this.handleClick}
                            />
                        </Paper> */}
                    </div>
                );
            } else return null;
        }

        return dataView()

    }
}

export default DataHubComponent;