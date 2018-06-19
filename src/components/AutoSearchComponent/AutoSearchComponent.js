import React, { Component } from 'react';
import './AutoSearchComponent.css';
import TextField from '@material-ui/core/TextField';
import Downshift from 'downshift';
import Paper from '@material-ui/core/Paper';
import { MenuItem } from '@material-ui/core';
import api from '../../services/api';
import { debounce } from 'throttle-debounce';

class AutoSearchComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            options: [],
            limit: props.limit || 30,
            endpoint: props.endpoint || 'diseases',
            property: props.property || 'name',
        }

        this.callApi = debounce(300, this.callApi.bind(this));
        this.refreshOptions = this.refreshOptions.bind(this);
    }

    componentWillUnmount(){
        this.callApi = null;
        this.refreshOptions = null;
    }

    refreshOptions(e) {
        this.callApi(e.target.value);
    }

    callApi(value) {
        api.get('/' + this.state.endpoint + '?' + this.state.property + '=~' + value + '&limit=' + this.state.limit).then(response => {
            response = response.map(object => { return { value: object.name, rid: object['@rid'] } });
            this.setState({ options: response });
        })
    }

    render() {
        let options = (inputValue, getItemProps) => {
            return this.state.options.map((item, index) => (
                <MenuItem
                    {...getItemProps({
                        key: item.rid,
                        index,
                        item,
                    })}
                >
                    {item.value}
                </MenuItem>
            ))
        }

        return (
            <Downshift
                onChange={(e) => { this.props.onChange({ target: e }) }}
                itemToString={item => { if (item) return item.value; }}
            >
                {({
                    getInputProps,
                    getItemProps,
                    getLabelProps,
                    isOpen,
                    inputValue,
                    highlightedIndex,
                    selectedItem,
                }) => (
                        <div className="autosearch-wrapper">
                            <TextField
                                onChange={(e) => { this.props.onChange(e) }}
                                onKeyUp={this.refreshOptions}
                                fullWidth
                                required={this.props.required}
                                label={this.props.label}
                                InputProps={{
                                    ...getInputProps({
                                        placeholder: this.props.placeholder,
                                        value: this.props.value,
                                        onChange: this.props.onChange,
                                        name: this.props.name,
                                    })
                                }}
                            />
                            {isOpen ? (
                                <Paper className="droptions" square>
                                    {options(inputValue, getItemProps)}
                                </Paper>
                            ) : null}
                        </div>
                    )}
            </Downshift>
        )
    }
}
export default AutoSearchComponent;