import React, { Component } from 'react';
import './AddNodeComponent.css';
import TextField from '@material-ui/core/TextField';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import FolderIcon from '@material-ui/icons/Folder';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';


class AddNodeComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            subset: '',
            subsets: {},
            relationship: {
                type: '',
                in: '',
                out: '',
                targetName: ''
            },
            relationships: [],
            source: '',
            sourceId: '',
            name: '',
            longName: '',
            description: '',
            sourceVersion: '',
            sourceIdVersion: '',
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleRelationship = this.handleRelationship.bind(this);
        this.addSubset = this.addSubset.bind(this);
        this.addRelationship = this.addRelationship.bind(this);

    }

    addSubset(e) {
        if (this.state.subset.trim()) {
            let subsets = this.state.subsets;
            subsets[this.state.subset] = this.state.subset;
            this.setState({
                subsets: subsets,
                subset: ''
            })
        }
        e.preventDefault();
    }

    deleteSubset(e, subset) {
        delete this.state.subsets[subset];
        this.setState({ subsets: this.state.subsets });
    }

    handleSubmit(e) {
        alert('submitted!');
        e.preventDefault();
        return;
        //bundle everything, cascade calls.
    };

    handleChange = e => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleRelationship(e, key) {
        let r = this.state.relationship;
        r[key] = e.target.value;
        this.setState({ relationship: r });
    }

    //Also get the rids
    addRelationship(e) {
        if (this.state.relationship.targetName.trim() && this.state.relationship.type) {
            let relationships = this.state.relationships;
            relationships.push(this.state.relationship);
            this.setState({
                relationships: relationships,
                relationship: {
                    type: '',
                    in: '',
                    out: '',
                    targetName: ''
                }
            })
        }
        e.preventDefault();
    }

    deleteRelationship(e, relationship) {
        let i = this.state.relationships.findIndex(r => relationship === r);
        delete this.state.relationships[i];
        this.setState({ relationships: this.state.relationships });

    }

    render() {
        let subsets = Object.keys(this.state.subsets).map(subset => {
            return (
                <ListItem key={subset}>
                    <ListItemIcon>
                        <FolderIcon />
                    </ListItemIcon>
                    <ListItemText primary={subset} />
                    <IconButton color='warn' onClick={(e) => { this.deleteSubset(e, subset) }}>
                        <CloseIcon />
                    </IconButton>
                </ListItem>
            )
        })

        let relationships = this.state.relationships.map(relationship => {
            return (
                <ListItem key={relationship}>
                    <ListItemIcon>
                        <FolderIcon />
                    </ListItemIcon>
                    <ListItemText primary={relationship.type + ': ' + relationship.targetName} />
                    <IconButton color='secondary' onClick={(e) => { this.deleteRelationship(e, relationship) }}>
                        <CloseIcon />
                    </IconButton>
                </ListItem>
            )
        })

        return (
            <form className='wrapper' onSubmit={this.handleSubmit}>
                <div className='basic-params'>
                    <h2 className='mat-h2'>Basic Parameters</h2>
                    <div className='input-wrapper'>
                        <AutoSearchComponent
                            value={this.state.source}
                            onChange={(e) => { this.handleChange({ target: { name: 'source', value: e.target.value } }) }}
                            endpoint='sources'
                            placeholder='eg. disease ontology'
                            name='source'
                            required={true}
                            label='Source'
                        />
                    </div>
                    <div className='input-wrapper'>
                        <TextField
                            id='sourceId'
                            placeholder='eg. NCIT:1032'
                            label='Source ID'
                            value={this.state.sourceId}
                            onChange={this.handleChange}
                            className='text-input'
                            name='sourceId'
                            required
                        />
                    </div>
                    <div className='input-wrapper'>
                        <TextField
                            id='name'
                            placeholder='eg. angiosarcoma'
                            label='Name'
                            value={this.state.name}
                            onChange={this.handleChange}
                            className='text-input'
                            name='name'
                            multiline
                        />
                    </div>
                    <div className='input-wrapper'>
                        <TextField
                            id='longName'
                            label='Long Name'
                            value={this.state.longName}
                            onChange={this.handleChange}
                            className='text-input'
                            name='longName'
                            multiline
                        />
                    </div>
                    <div className='input-wrapper'>
                        <TextField
                            id='description'
                            label='Description'
                            value={this.state.description}
                            onChange={this.handleChange}
                            className='text-input'
                            name='description'
                            multiline
                        />
                    </div>
                    <div className='input-wrapper'>
                        <TextField
                            id='sourceVersion'
                            label='Source Version'
                            value={this.state.sourceVersion}
                            onChange={this.handleChange}
                            className='text-input'
                            name='sourceVersion'
                        />
                    </div>
                    <div className='input-wrapper'>
                        <TextField
                            id='sourceIdVersion'
                            label='Source ID Version'
                            value={this.state.sourceIdVersion}
                            onChange={this.handleChange}
                            className='text-input'
                            name='sourceIdVersion'
                        />
                    </div>
                </div>
                <div className='subsets-selection'>
                    <h2 className='mat-h2'>Subsets</h2>
                    <List className='list'>
                        {subsets}
                    </List>
                    <div className='input-wrapper'>
                        <TextField
                            id='subset-temp'
                            label='Add a Subset'
                            value={this.state.subset}
                            onChange={this.handleChange}
                            className='text-input'
                            name='subset'
                            onKeyDown={e => { if (e.keyCode === 13) { this.addSubset(e); } }}
                        />
                        <IconButton color='primary' onClick={this.addSubset}>
                            <AddIcon />
                        </IconButton>
                    </div>
                </div>
                <div className='relationships-selection'>
                    <h2 className='mat-h2'>Relationships</h2>
                    <List className='list'>
                        {relationships}
                    </List>
                    <div className='input-wrapper'
                        onKeyDown={(e) => { if (e.keyCode === 13) this.addRelationship(e) }}>

                        <FormControl >
                            <InputLabel htmlFor='relation-type'>Type</InputLabel>
                            <Select
                                value={this.state.relationship.type}
                                onChange={(e) => { this.handleRelationship(e, 'type') }}
                                className='type-select'
                                inputProps={{
                                    name: 'relationship-type',
                                    id: 'relation-type',
                                }}
                            >
                                <MenuItem value=''>
                                    <em>None</em>
                                </MenuItem>
                                <MenuItem value={'parent'}>Parent</MenuItem>
                                <MenuItem value={'child'}>Child</MenuItem>
                                <MenuItem value={'alias'}>Alias</MenuItem>
                            </Select>
                        </FormControl>
                        {/* <TextField
                            id='relationhsip-name-temp'
                            label='Target Name'
                            value={this.state.relationship.targetName}
                            onChange={(e) => { this.handleRelationship(e, 'targetName') }}
                            className='text-input'
                        /> */}

                        <div className='search-wrap'>
                            <AutoSearchComponent
                                value={this.state.relationship.targetName}
                                onChange={(e) => { this.handleRelationship(e, 'targetName') }}
                                placeholder='Target Name'
                                limit={10}
                            />
                        </div>
                        <IconButton color='primary' onClick={this.addRelationship}>
                            <AddIcon />
                        </IconButton>
                    </div>
                </div>
                <div className='submit-button'>
                    <Button type='submit' variant='outlined'>Add Node</Button>
                </div>
            </form>
        )
    }
}

export default AddNodeComponent;
