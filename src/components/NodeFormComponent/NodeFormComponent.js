import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import './NodeFormComponent.css';
import {
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  MenuItem,
  Button,
  Typography,
  Divider,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import FolderIcon from '@material-ui/icons/Folder';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import * as jc from 'json-cycle';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import api from '../../services/api';

/**
 * Component for editing or adding database nodes.
 */
class NodeFormComponent extends Component {
  /**
   * Formats input node relationships and adds them to state relationship list.
   * @param {Object} node - node object.
   * @param {Array<Object>} relationships - current relationship list.
   * @param {string} key - node object key specifying edge type.
   */
  static processRelationships(node, relationships, key) {
    if (node[key]) {
      node[key].forEach((edge) => {
        relationships.push({
          '@rid': edge['@rid'],
          in: edge.in['@rid'],
          out: edge.out['@rid'],
          '@class': key.split('_')[1],
          targetName:
            edge.out.name === node.name ? edge.in.name : edge.out.name,
          source: edge.source['@rid'] || edge.source,
        });
      });
    }

    return relationships;
  }

  constructor(props) {
    super(props);

    this.state = {
      node: { '@rid': -1 }, // placeholder rid, new node hasn't been assigned a real rid yet
      form: {
        source: '',
        sourceId: '',
        name: '',
        longName: '',
        description: '',
        sourceIdVersion: '',
        subsets: [],
        subset: '',
        relationship: {
          '@class': '',
          targetName: '',
          in: '',
          out: '',
          source: '',
        },
        relationships: [],
      },
      edgeTypes: [],
      sources: [],
      completedFlag: false,
    };

    this.handleFormChange = this.handleFormChange.bind(this);
    this.handleSubsetAdd = this.handleSubsetAdd.bind(this);
    this.handleSubsetDelete = this.handleSubsetDelete.bind(this);
    this.handleRelationshipAdd = this.handleRelationshipAdd.bind(this);
    this.handleRelationship = this.handleRelationship.bind(this);
    this.handleRelationshipDirection = this.handleRelationshipDirection.bind(this);
    this.handleRelationshipDelete = this.handleRelationshipDelete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDeleteNode = this.handleDeleteNode.bind(this);

    this.initNode = this.initNode.bind(this);
  }

  /**
   * Loads sources and edge types from the api, initializes fields if form is an edit variant.
   */
  async componentDidMount() {
    const sources = await api.getSources();
    const edgeTypes = await api.getOntologyEdges();
    const { variant } = this.props;

    this.setState({ sources, edgeTypes }, () => {
      if (variant === 'edit') {
        this.initNode();
      } else {
        const { form } = this.state;
        form.relationship.out = -1;
      }
    });
  }

  /**
   * Initializes input node to be edited. Calls api to refresh its properties.
   */
  initNode() {
    const { selectedId } = this.props;
    const { edgeTypes } = this.state;

    api
      .get(`/diseases/${selectedId.slice(1)}?neighbors=3`)
      .then((response) => {
        const cycled = jc.retrocycle(response.result);
        let relationships = [];
        const expandedEdgeTypes = edgeTypes.reduce((r, e) => {
          r.push({ name: `in_${e.name}` });
          r.push({ name: `out_${e.name}` });
          return r;
        }, []);

        expandedEdgeTypes.forEach((type) => {
          relationships = NodeFormComponent.processRelationships(
            cycled,
            relationships,
            type.name,
          );
        });

        // create copy of original node and initialize form fields.
        const { node, form } = this.state;
        Object.keys(cycled).forEach((key) => {
          node[key] = key === 'subsets'
            ? cycled[key].slice(0, cycled[key].length)
            : cycled[key];
          form[key] = cycled[key];
        });
        // shallow copy of array object.
        node.relationships = relationships.slice(0, relationships.length);
        form.relationships = relationships;
        form.relationship.out = cycled['@rid'];

        this.setState({ node, form });
      });
  }

  /**
   * Changes state based on user input.
   * @param {Event} e - user input event.
   */
  handleFormChange(e) {
    const { form } = this.state;
    form[e.target.name] = e.target.value;
    this.setState({ form });
  }

  /**
   * Adds new subset to state list. Clears subset field.
   * @param {Event} e - User request subset add event.
   */
  handleSubsetAdd(e) {
    e.preventDefault();
    const { form } = this.state;

    if (form.subset && !form.subsets.includes(form.subset.toLowerCase())) {
      form.subsets.push(form.subset);
      form.subset = '';
      this.setState({ form });
    }
  }

  /**
   * Deletes subset from state subset list.
   * @param {string} subset - Subset to be deleted.
   */
  handleSubsetDelete(subset) {
    const { form } = this.state;
    if (form.subsets.indexOf(subset) !== -1) {
      form.subsets.splice(form.subsets.indexOf(subset), 1);
    }
    this.setState({ form });
  }

  /**
   * Validates and then adds a new relationship to state list.
   * Clears relationship fields.
   * @param {Event} e - User request relationship add event.
   */
  handleRelationshipAdd(e) {
    e.preventDefault();
    const { form, node } = this.state;
    const { relationship, relationships } = form;
    if (
      relationship.in
      && relationship.out
      && relationship['@class']
      && relationship.source
    ) {
      if (
        relationships.filter(r => r.out === relationship.out
          && r.in === relationship.in
          && r['@class'] === relationship['@class']
          && r.source === relationship.source)
          .length === 0
      ) {
        relationships.push(relationship);
        form.relationships = relationships;
        form.relationship = {
          '@class': '',
          targetName: '',
          in: '',
          out: node['@rid'],
          source: '',
        };
        this.setState({ form });
      }
    }
  }

  /**
   * Deletes a relationship from state relationship list.
   * @param {Object} relationship - Relationship to be deleted
   */
  handleRelationshipDelete(relationship) {
    const { form } = this.state;
    const { relationships } = form;
    if (relationships.indexOf(relationship) !== -1) {
      relationships.splice(relationships.indexOf(relationship), 1);
    }
    form.relationships = relationships;
    this.setState({ form });
  }

  /**
   * Updates staged relationship object from user input.
   * @param {Event} e - User input event.
   */
  handleRelationship(e) {
    const { form, node } = this.state;
    form.relationship[e.target.name] = e.target.value;
    if (e.target['@rid']) {
      if (form.relationship.in === node['@rid']) {
        form.relationship.out = e.target['@rid'];
      } else {
        form.relationship.in = e.target['@rid'];
      }
    }
    this.setState({ form });
  }

  /**
   * Updates staged relationship direction by swapping in/out properties.
   */
  handleRelationshipDirection() {
    const { form, node } = this.state;

    if (form.relationship.in === node['@rid']) {
      form.relationship.in = form.relationship.out;
      form.relationship.out = node['@rid'];
    } else {
      form.relationship.out = form.relationship.in;
      form.relationship.in = node['@rid'];
    }
    this.setState({ form });
  }

  /**
   * Submits form.
   * @param {Event} e - Submit event.
   */
  handleSubmit(e) {
    e.preventDefault();
    const { variant } = this.props;

    if (variant === 'edit') {
      this.editSubmit();
    } else {
      this.addSubmit();
    }
  }

  /**
   * Deletes target node.
   */
  handleDeleteNode() {
    const { node } = this.state;
    const { handleNodeDelete } = this.props;

    api.delete(
      `/${node['@class'].toLowerCase()}s/${node['@rid'].slice(1)}`,
    ).then(() => {
      handleNodeDelete(node['@rid']);
    });
  }

  /**
   * Adds new edges and deletes specified ones, then patches property changes to the api.
   */
  async editSubmit() {
    const { form, node } = this.state;
    const { handleNodeFinishEdit } = this.props;

    const changedEdges = [];

    node.relationships.forEach((initRelationship) => {
      if (
        form.relationships.filter(
          r => r.out === initRelationship.out
            && r.in === initRelationship.in
            && r['@class'] === initRelationship['@class']
            && r.source === initRelationship.source,
        ).length === 0
      ) {
        changedEdges.push(api.delete(
          `/${initRelationship['@class'].toLowerCase()}/${initRelationship['@rid'].slice(1)}`,
        ));
      }
    });

    for (let i = 0; i < form.relationships.length; i += 1) {
      const currRelationship = form.relationships[i];
      if (
        node.relationships.filter(
          r => r.out === currRelationship.out
            && r.in === currRelationship.in
            && r['@class'] === currRelationship['@class']
            && r.source === currRelationship.source,
        ).length === 0
      ) {
        changedEdges.push(api.post(`/${currRelationship['@class'].toLowerCase()}`, {
          in: currRelationship.in,
          out: currRelationship.out,
          source: currRelationship.source,
        }));
      }
    }
    await Promise.all(changedEdges);

    const payload = {};
    let changed = false;
    if (form.name !== node.name) {
      changed = true;
      payload.name = form.name;
    }
    if (form.longName !== node.longName) {
      changed = true;
      payload.longName = form.longName;
    }
    if (form.description !== node.description) {
      changed = true;
      payload.description = form.description;
    }
    if (form.sourceIdVersion !== node.sourceIdVersion) {
      changed = true;
      payload.sourceIdVersion = form.sourceIdVersion;
    }

    payload.subsets = [];

    form.subsets.forEach((subset) => {
      if (!node.subsets.includes(subset)) {
        changed = true;
        payload.subsets.push(subset);
      }
    });
    node.subsets.forEach((subset) => {
      if (form.subsets.includes(subset)) payload.subsets.push(subset);
      else changed = true;
    });

    if (changed) {
      const response = await api.patch(
        `/${node['@class'].toLowerCase()}s/${node['@rid'].slice(1)}`,
        payload,
      );
      this.setState({ node: response.result });
    }

    handleNodeFinishEdit(node);
  }

  /**
   * Posts new node to the api, then posts all new edges.
   */
  async addSubmit() {
    const { form } = this.state;
    const newEdges = [];
    if (!form.source || !form.sourceId) return;
    // TODO: Scale up to all ontology types, not just diseases
    const response = await api.post('/diseases', {
      source: form.source,
      sourceId: form.sourceId,
      name: form.name,
      longName: form.longName,
      subsets: form.subsets,
      description: form.description,
      sourceIdVersion: form.sourceIdVersion,
    });

    for (let i = 0; i < form.relationships.length; i += 1) {
      const relationship = form.relationships[i];
      if (relationship.in === -1) {
        relationship.in = response.result['@rid'];
      } else {
        relationship.out = response.result['@rid'];
      }

      newEdges.push(api.post(`/${relationship['@class'].toLowerCase()}`, {
        in: relationship.in,
        out: relationship.out,
        source: relationship.source,
      }));
    }
    await Promise.all(newEdges);
    this.setState({ completedFlag: true });
  }

  render() {
    const {
      form,
      node,
      edgeTypes,
      completedFlag,
      sources,
    } = this.state;
    const { variant } = this.props;
    if (completedFlag) return <Redirect push to="/query" />;

    const subsets = form.subsets.map(subset => (
      <ListItem key={subset}>
        <ListItemIcon>
          <FolderIcon />
        </ListItemIcon>
        <ListItemText primary={subset} style={{ overflow: 'auto' }} />
        <IconButton
          onClick={() => this.handleSubsetDelete(subset)}
        >
          <CloseIcon color="error" />
        </IconButton>
      </ListItem>
    ));
    const relationships = form.relationships.map((relationship) => {
      const sourceName = sources.find(
        s => s['@rid'] === relationship.source,
      ).name;
      const typeName = relationship.in === node['@rid']
        ? `has${relationship['@class'].slice(0, relationship['@class'].length - 2)}`
        : relationship['@class'];
      return (
        <ListItem key={`${typeName}: ${relationship.targetName}`}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText
            primary={`${typeName}: ${relationship.targetName}`}
            secondary={sourceName}
            style={{ overflow: 'auto' }}
          />
          <IconButton
            color="secondary"
            onClick={() => this.handleRelationshipDelete(relationship)}
          >
            <CloseIcon color="error" />
          </IconButton>
        </ListItem>
      );
    });
    const edgeTypesDisplay = (edgeType) => {
      const inOut = form.relationship.in === node['@rid']
        ? `has${edgeType.name.slice(0, edgeType.name.length - 2)}`
        : edgeType.name;
      return (
        <MenuItem key={edgeType.name} value={edgeType.name}>
          {inOut}
        </MenuItem>
      );
    };
    const source = variant === 'edit'
      ? (
        <ListItem>
          <ListItemText
            primary="Source:"
            secondary={node.source ? node.source.name : null}
          />
        </ListItem>
      ) : (
        <ListItem>
          <ResourceSelectComponent
            value={form.source}
            onChange={this.handleFormChange}
            name="source"
            label="Source"
            id="source"
            required
            resources={sources}
          />
        </ListItem>
      );
    const sourceId = variant === 'edit'
      ? (
        <ListItem>
          <ListItemText
            primary="Source ID:"
            secondary={node.sourceId}
          />
        </ListItem>
      ) : (
        <ListItem className="input-wrapper">
          <TextField
            id="sourceId"
            placeholder="eg. NCIT:0123"
            label="Source ID"
            value={form.sourceId}
            onChange={this.handleFormChange}
            className="text-input"
            name="sourceId"
            required
          />
        </ListItem>
      );

    return (
      <div className="node-form-wrapper">
        <Typography variant="display1" className="form-title">
          {variant === 'edit' ? 'Edit Term' : 'Add New Term'}
        </Typography>
        <Divider />
        <form onSubmit={this.handleSubmit}>
          <div className="param-section">
            <Typography variant="title">
              Basic Parameters
            </Typography>
            <List component="nav">
              {source}
              {sourceId}
              <ListItem className="input-wrapper">
                <TextField
                  id="name"
                  placeholder="eg. angiosarcoma"
                  label="Name"
                  value={form.name}
                  onChange={this.handleFormChange}
                  className="text-input"
                  name="name"
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="longName"
                  label="Long Name"
                  value={form.longName}
                  onChange={this.handleFormChange}
                  className="text-input"
                  name="longName"
                  multiline
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="description"
                  label="Description"
                  value={form.description}
                  onChange={this.handleFormChange}
                  className="text-input"
                  name="description"
                  multiline
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="sourceIdVersion"
                  label="Source ID Version"
                  value={form.sourceIdVersion}
                  onChange={this.handleFormChange}
                  className="text-input"
                  name="sourceIdVersion"
                />
              </ListItem>
            </List>
          </div>
          <div className="param-section">
            <Typography variant="title">
              Subsets
            </Typography>
            <ListItem className="input-wrapper">
              <TextField
                id="subset-temp"
                label="Add a Subset"
                value={form.subset}
                onChange={this.handleFormChange}
                className="text-input"
                name="subset"
                onKeyDown={(e) => {
                  if (e.keyCode === 13) {
                    this.handleSubsetAdd(e);
                  }
                }}
              />
              <IconButton color="primary" onClick={this.handleSubsetAdd}>
                <AddIcon />
              </IconButton>
            </ListItem>
            <List className="list">
              {subsets}
            </List>
          </div>
          <div className="param-section">
            <Typography variant="title">
              Relationships
            </Typography>
            <ListItem
              className="input-wrapper relationship-add-wrapper"
              onKeyDown={(e) => {
                if (e.keyCode === 13) this.handleRelationshipAdd(e);
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: '1',
                }}
              >
                <ResourceSelectComponent
                  value={form.relationship.source}
                  onChange={this.handleRelationship}
                  name="source"
                  label="Source"
                  resources={sources}
                />
                <div style={{ display: 'flex', width: '100%' }}>
                  <div className="relationship-dir-type">
                    <IconButton
                      disableRipple
                      name="direction"
                      onClick={this.handleRelationshipDirection}
                      color="primary"
                    >
                      <TrendingFlatIcon
                        style={{ margin: '20px 24px 0 0' }}
                        className={
                          form.relationship.in === node['@rid']
                            ? 'relationship-in'
                            : 'relationship-out'
                        }
                      />
                    </IconButton>
                    <ResourceSelectComponent
                      value={form.relationship['@class']}
                      onChange={this.handleRelationship}
                      name="@class"
                      label="Type"
                      resources={edgeTypes}
                    >
                      {edgeTypesDisplay}
                    </ResourceSelectComponent>
                  </div>
                  <div className="search-wrap">
                    <AutoSearchComponent
                      value={form.relationship.targetName}
                      onChange={this.handleRelationship}
                      placeholder="Target Name"
                      limit={10}
                      name="targetName"
                    />
                  </div>
                </div>
              </div>
              <IconButton
                style={{ margin: 'auto 8px' }}
                color="primary"
                onClick={this.handleRelationshipAdd}
              >
                <AddIcon />
              </IconButton>
            </ListItem>
            <List className="list">
              {relationships}
            </List>
          </div>
          <div className="submit-button">
            <Button type="submit" disabled={!form.source || !form.sourceId} variant="raised" color="primary">
              {variant === 'edit' ? 'Confirm Changes' : 'Submit'}
            </Button>
          </div>
          {variant === 'edit' ? (
            <div className="delete-button">
              <Button variant="raised" onClick={this.handleDeleteNode}>
                Delete
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    );
  }
}

NodeFormComponent.defaultProps = {
  variant: 'edit',
  handleNodeDelete: null,
  handleNodeFinishEdit: null,
  selectedId: null,
};

/**
 * @param {string} selectedId - node database identifier.
 * @param {string} variant - specifies form type/function.
 * @param {function} handleNodeDelete - parent method triggered on node delete.
 * @param {function} handleNodeFinishEdit - parent method triggered when node is edited.
 */
NodeFormComponent.propTypes = {
  selectedId: PropTypes.string,
  variant: PropTypes.string,
  handleNodeDelete: PropTypes.func,
  handleNodeFinishEdit: PropTypes.func,
};

export default NodeFormComponent;
