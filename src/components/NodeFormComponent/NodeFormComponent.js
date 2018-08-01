import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './NodeFormComponent.css';
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  MenuItem,
  Button,
  Typography,
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Tooltip,
  ListItemSecondaryAction,
  Card,
  InputAdornment,
  Paper,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import HelpIcon from '@material-ui/icons/Help';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import api from '../../services/api';
import util from '../../services/util';

/**
 * Component for editing or adding database nodes.
 */
class NodeFormComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      originalNode: null,
      form: null,
      edgeTypes: [],
      sources: [],
      ontologyTypes: [],
      newNodeClass: 'Disease',
      relationships: [],
      relationship: {
        '@class': '',
        targetName: '',
        targetSourceId: '',
        in: '',
        out: -1,
        source: '',
      },
      subset: '',
      deleteDialog: false,
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
    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleDialogOpen = this.handleDialogOpen.bind(this);
  }

  /**
   * Loads sources and edge types from the api, initializes fields if form is an edit variant.
   */
  async componentDidMount() {
    const sources = await api.getSources();
    const schema = await api.getSchema();
    const { node } = this.props;
    const { relationships, relationship } = this.state;

    let originalNode = { '@rid': -1 };
    let nodeClass = 'Disease'; // default

    if (node) {
      originalNode = node;
      nodeClass = node['@class'];
      relationship.out = node['@rid'];
    }

    const editableProps = (await api.getClass(nodeClass)).properties;
    const form = {};

    editableProps.forEach((prop) => {
      const {
        name,
        type,
        linkedClass,
        defaultValue,
      } = prop;
      switch (type) {
        case 'embeddedset':
          form[name] = originalNode[name] || [];
          break;
        case 'link':
          form[`${name}.@rid`] = (originalNode[name] || '')['@rid'] || '';
          form[name] = (originalNode[name] || '').name || '';

          if (!linkedClass) {
            form[`${name}.class`] = (originalNode[name] || '')['@class'] || '';
          }

          if ((originalNode[name] || '').sourceId) {
            form[`${name}.sourceId`] = (originalNode[name] || '').sourceId || '';
          }

          break;
        case 'integer' || 'long':
          if (originalNode[name] === 0) {
            form[name] = 0;
          } else {
            form[name] = originalNode[name] || defaultValue || '';
          }
          break;
        case 'boolean':
          form[name] = originalNode[name] || defaultValue.toString() === 'true';
          break;
        default:
          form[name] = originalNode[name] || defaultValue || '';
          break;
      }
    });
    const edgeTypes = util.getEdges(schema);
    const ontologyTypes = util.getOntologies(schema);
    const expandedEdgeTypes = edgeTypes.reduce((r, e) => {
      r.push(`in_${e}`);
      r.push(`out_${e}`);
      return r;
    }, []);

    expandedEdgeTypes.forEach((type) => {
      if (originalNode[type]) {
        originalNode[type].forEach((edge) => {
          if (edge['@class'] !== 'Implies') { // TODO: remove filter for implies edges.
            relationships.push({
              '@rid': edge['@rid'],
              in: edge.in['@rid'],
              out: edge.out['@rid'],
              '@class': edge['@class'],
              targetName:
                edge.out['@rid'] === originalNode['@rid'] ? edge.in.name : edge.out.name,
              targetSourceId:
                edge.out['@rid'] === originalNode['@rid'] ? edge.in.sourceId : edge.out.sourceId,
              source: edge.source['@rid'] || edge.source,
              key: type,
            });
          }
        });
      }
    });

    originalNode.relationships = relationships.slice(0);
    this.setState({
      form,
      relationships,
      originalNode,
      sources,
      edgeTypes,
      ontologyTypes,
      editableProps,
      newNodeClass: nodeClass,
    });
  }

  /**
   * Re renders form input fields based on class editable properties.
   * @param {Event} e - Class selection event
   */
  async handleClassChange(e) {
    const newNodeClass = e.target.value;
    const editableProps = (await api.getClass(newNodeClass)).properties;
    const { form } = this.state;
    editableProps.forEach((prop) => {
      const { name, type } = prop;
      if (!form[name]) {
        switch (type) {
          case 'embeddedset':
            form[name] = [];
            break;
          default:
            form[name] = '';
            break;
        }
      }
    });
    this.setState({ form, editableProps, newNodeClass });
  }

  /**
   * Changes form state based on user input.
   * @param {Event} e - user input event.
   */
  handleFormChange(e) {
    const { form } = this.state;
    form[e.target.name] = e.target.value;

    if (e.target['@rid']) {
      form[`${e.target.name}.@rid`] = e.target['@rid'];
    } else if (form[`${e.target.name}.@rid`]) {
      form[`${e.target.name}.@rid`] = '';
    }
    if (e.target.sourceId) {
      form[`${e.target.name}.sourceId`] = e.target.sourceId;
    } else if (form[`${e.target.name}.sourceId`]) {
      form[`${e.target.name}.sourceId`] = '';
    }

    this.setState({ form });
  }

  /**
   * Changes state base on user input.
   * @param {Event} e - user input event.
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  /**
   * Adds new subset to state list. Clears subset field.
   * @param {Event} e - User request subset add event.
   */
  handleSubsetAdd(e) {
    e.preventDefault();
    const { form, subset } = this.state;

    if (subset && !form.subsets.includes(subset.toLowerCase())) {
      form.subsets.push(subset);
      this.setState({ form, subset: '' });
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
    const {
      form,
      originalNode,
      relationship,
      relationships,
    } = this.state;
    if (
      relationship.in
      && relationship.out
      && relationship['@class']
      && relationship.source
    ) {
      if (
        !relationships.find(r => r.out === relationship.out
          && r.in === relationship.in
          && r['@class'] === relationship['@class']
          && r.source === relationship.source)
      ) {
        relationships.push(relationship);
        this.setState({
          form,
          relationships,
          relationship: {
            '@class': '',
            targetName: '',
            targetSourceId: '',
            in: '',
            out: originalNode['@rid'],
            source: '',
            key: '',
          },
        });
      }
    }
  }

  /**
   * Deletes a relationship from state relationship list.
   * @param {Object} relationship - Relationship to be deleted
   */
  handleRelationshipDelete(relationship) {
    const { relationships } = this.state;
    if (relationships.indexOf(relationship) !== -1) {
      relationships.splice(relationships.indexOf(relationship), 1);
    }
    this.setState({ relationships });
  }

  /**
   * Updates staged relationship object from user input.
   * @param {Event} e - User input event.
   */
  handleRelationship(e) {
    const { originalNode, relationship } = this.state;
    relationship[e.target.name] = e.target.value;
    if (e.target['@rid']) {
      if (relationship.in === originalNode['@rid']) {
        relationship.out = e.target['@rid'];
      } else {
        relationship.in = e.target['@rid'];
      }
    }
    if (e.target.sourceId) {
      relationship.targetSourceId = e.target.sourceId;
    }
    this.setState({ relationship });
  }

  /**
   * Updates staged relationship direction by swapping in/out properties.
   */
  handleRelationshipDirection() {
    const { relationship, originalNode } = this.state;

    if (relationship.in === originalNode['@rid']) {
      relationship.in = relationship.out;
      relationship.out = originalNode['@rid'];
    } else {
      relationship.out = relationship.in;
      relationship.in = originalNode['@rid'];
    }
    this.setState({ relationship });
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
    const { originalNode } = this.state;
    const { handleNodeDelete } = this.props;

    api.delete(
      `/${util.pluralize(originalNode['@class'])}/${originalNode['@rid'].slice(1)}`,
    ).then(() => {
      handleNodeDelete();
    });
  }

  /**
   * Opens node deletion dialog.
   */
  handleDialogOpen() {
    this.setState({ deleteDialog: true });
  }

  /**
   * Closes node deletion dialog.
   */
  handleDialogClose() {
    this.setState({ deleteDialog: false });
  }

  /**
   * Adds new edges and deletes specified ones, then patches property changes to the api.
   */
  async editSubmit() {
    const {
      form,
      originalNode,
      relationships,
      editableProps,
    } = this.state;
    const { handleNodeFinishEdit } = this.props;

    const changedEdges = [];

    /* Checks for differences in original node and submitted form. */

    // Deletes edges that are no longer present on the edited node.
    originalNode.relationships.forEach((initRelationship) => {
      if (
        !relationships.find(
          r => r.out === initRelationship.out
            && r.in === initRelationship.in
            && r['@class'] === initRelationship['@class']
            && r.source === initRelationship.source,
        )
      ) {
        changedEdges.push(api.delete(
          `/${initRelationship['@class'].toLowerCase()}/${initRelationship['@rid'].slice(1)}`,
        ));
      }
    });

    // Adds new edges that were not present on the original node.
    relationships.forEach((currRelationship) => {
      if (
        !originalNode.relationships.find(
          r => r.out === currRelationship.out
            && r.in === currRelationship.in
            && r['@class'] === currRelationship['@class']
            && r.source === currRelationship.source,
        )
      ) {
        changedEdges.push(api.post(`/${currRelationship['@class'].toLowerCase()}`, {
          in: currRelationship.in,
          out: currRelationship.out,
          source: currRelationship.source,
        }));
      }
    });

    await Promise.all(changedEdges);

    const payload = util.parsePayload(form, editableProps);

    api.patch(
      `/${util.pluralize(originalNode['@class'])}/${originalNode['@rid'].slice(1)}`,
      { ...payload },
    ).then(() => {
      handleNodeFinishEdit();
    });
  }

  /**
   * Posts new node to the api, then posts all new edges.
   */
  async addSubmit() {
    const {
      form,
      relationships,
      newNodeClass,
      editableProps,
    } = this.state;
    const { handleNodeFinishEdit } = this.props;

    const newEdges = [];
    const payload = util.parsePayload(form, editableProps);
    const response = await api.post(`/${util.pluralize(newNodeClass)}`, { ...payload });

    for (let i = 0; i < relationships.length; i += 1) {
      const relationship = relationships[i];
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
    handleNodeFinishEdit();
  }

  render() {
    const {
      form,
      originalNode,
      sources,
      edgeTypes,
      ontologyTypes,
      editableProps,
      relationship,
      relationships,
      subset,
      newNodeClass,
      deleteDialog,
    } = this.state;
    const { variant, handleNodeFinishEdit } = this.props;

    // Wait for form to get initialized
    if (!form) return null;

    // Validates form
    let formIsInvalid = false;
    editableProps.forEach((prop) => {
      if (prop.mandatory) {
        if (prop.type === 'link' && (!form[prop.name] || !form[`${prop.name}.@rid`])) {
          formIsInvalid = true;
        } else if (prop.type !== 'boolean' && !form[prop.name]) {
          formIsInvalid = true;
        }
      }
    });

    const dialog = (
      <Dialog
        onClose={this.handleDialogClose}
        open={deleteDialog}
      >
        <DialogTitle>
          Really Delete this Term?
        </DialogTitle>
        <DialogContent>
          <DialogActions style={{ justifyContent: 'center' }}>
            <Button
              onClick={this.handleDialogClose}
            >
              No
            </Button>
            <Button
              onClick={this.handleDeleteNode}
            >
              Yes
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    );

    /**
     * Renders input component to fit property's importance and type.
     */
    const formatInputSection = (key, value) => {
      const property = editableProps.find(prop => prop.name === key);
      if (!property) return null;

      const {
        type,
        mandatory,
        linkedClass,
        description,
      } = property;
      if (typeof value !== 'object') {
        // Radio group component for boolean types.
        if (type === 'boolean') {
          return (
            <ListItem className="input-wrapper" key={key}>
              <FormControl component="fieldset" required={mandatory}>
                <FormLabel>
                  {util.antiCamelCase(key)}
                </FormLabel>
                <RadioGroup
                  name={key}
                  onChange={this.handleFormChange}
                  value={value.toString()}
                  style={{ flexDirection: 'row' }}
                >
                  <FormControlLabel value="true" control={<Radio />} label="Yes" />
                  <FormControlLabel value="false" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </ListItem>
          );
        }

        // For text fields, apply some final changes for number inputs.
        if (type !== 'link') {
          let t;
          let step;
          if (type === 'string') {
            t = 'text';
          } else if (type === 'integer' || type === 'long') {
            t = 'number';
            step = 1;
          }

          return (
            <ListItem className="input-wrapper" key={key}>
              <TextField
                id={key}
                label={util.antiCamelCase(key)}
                value={value}
                onChange={this.handleFormChange}
                className="text-input"
                name={key}
                type={t || ''}
                step={step || ''}
                required={mandatory}
                multiline={t === 'text'}
                InputProps={{
                  endAdornment: description ? (
                    <InputAdornment position="end">
                      <Tooltip title={description}>
                        <HelpIcon color="primary" />
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </ListItem>
          );
        }
        // If type is a link to another record, must find that record in the
        // database and store its rid.

        // Decide which endpoint to query.
        let endpoint;
        if (linkedClass) {
          endpoint = util.pluralize(linkedClass);
        } else {
          endpoint = 'ontologies';
        }

        return (
          <ListItem key={key} style={{ display: 'block' }}>
            <div>
              <AutoSearchComponent
                value={value}
                onChange={this.handleFormChange}
                name={key}
                label={util.antiCamelCase(key)}
                id={key}
                limit={30}
                endpoint={endpoint}
                required={mandatory}
                property={!linkedClass ? ['name', 'sourceId'] : undefined}
              />
            </div>
          </ListItem>
        );
      }
      if (Array.isArray(value)) {
        return null;
      }
      return null;
    };

    /**
     * Formats model subsets into list form.
     */
    const subsets = (form.subsets || []).map(s => (
      <ListItem
        key={s}
        className="form-list"
      >
        <ListItemText primary={s} style={{ overflow: 'auto' }} />
        <ListItemSecondaryAction>
          <IconButton
            onClick={() => this.handleSubsetDelete(s)}
          >
            <CloseIcon color="error" />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ));

    /**
     * Formats model relationships into list form.
     */
    const rships = relationships.map((r) => {
      const sourceName = sources.find(
        s => s['@rid'] === r.source,
      ).name;
      const typeName = r.in === originalNode['@rid']
        ? `has${r['@class'].slice(0, r['@class'].length - 2)}`
        : r['@class'];
      return (
        <ListItem
          key={`${r.key}: ${r['@rid']}`}
          className="form-list"
        >
          <ListItemText
            primary={`${typeName}: ${r.targetSourceId}`}
            secondary={sourceName}
            style={{ overflow: 'auto' }}
          />
          <ListItemSecondaryAction>
            <IconButton
              color="secondary"
              onClick={() => this.handleRelationshipDelete(r)}
            >
              <CloseIcon color="error" />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      );
    });

    /**
      * Formats valid edge types.
      * @param {Object} edgeType - Edge type object.
      */
    const edgeTypesDisplay = (edgeType) => {
      const inOut = relationship.in === originalNode['@rid']
        ? `has${edgeType.slice(0, edgeType.length - 2)}`
        : edgeType;
      return (
        <MenuItem key={edgeType} value={edgeType}>
          {inOut}
        </MenuItem>
      );
    };

    return (
      <div className="node-form-wrapper">
        {dialog}
        <div>
          <Paper className="form-header" elevation={4}>
            <Typography variant="display1" className="form-title">
              {variant === 'edit' ? 'Edit Ontology Term'
                : 'Add New Ontology Term'}
            </Typography>
            <Button
              color="default"
              onClick={handleNodeFinishEdit}
              variant="outlined"
            >
              Cancel
            </Button>
          </Paper>
        </div>
        <Divider />
        <form onSubmit={this.handleSubmit}>
          <Card className="param-section">
            <Typography variant="title">
              Basic Parameters
            </Typography>
            {variant === 'edit' ? null
              : (
                <div className="class-select">
                  <ResourceSelectComponent
                    value={newNodeClass}
                    onChange={this.handleClassChange}
                    name="newNodeClass"
                    label="Class"
                    resources={ontologyTypes}
                  >
                    {resource => (
                      <MenuItem key={resource.name} value={resource.name}>
                        {resource.name}
                      </MenuItem>
                    )}
                  </ResourceSelectComponent>
                </div>
              )}
            <List component="nav">
              {Object.keys(form)
                .filter(key => !key.includes('.'))
                .map(key => formatInputSection(key, form[key]))
              }
            </List>
          </Card>
          <Card className="param-section">
            <Typography variant="title">
              Subsets
            </Typography>
            <ListItem className="input-wrapper form-list">
              <TextField
                id="subset-temp"
                label="Add a Subset"
                value={subset}
                onChange={this.handleChange}
                className="text-input"
                name="subset"
                onKeyDown={(e) => {
                  if (e.keyCode === 13) {
                    this.handleSubsetAdd(e);
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton color="primary" onClick={this.handleSubsetAdd}>
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

            </ListItem>
            <List className="list">
              {subsets}
            </List>
            <Typography variant="title">
              Relationships
            </Typography>
            <ListItem
              className="input-wrapper relationship-add-wrapper form-list"
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
                  value={relationship.source}
                  onChange={this.handleRelationship}
                  name="source"
                  label="Source"
                  resources={sources}
                />
                <div style={{ display: 'flex', width: '100%', margin: '8px' }}>
                  <div className="relationship-dir-type">
                    <IconButton
                      disableRipple
                      name="direction"
                      onClick={this.handleRelationshipDirection}
                      color="primary"
                    >
                      <TrendingFlatIcon
                        className={
                          relationship.in === originalNode['@rid']
                            ? 'relationship-in'
                            : 'relationship-out'
                        }
                      />
                    </IconButton>
                    <ResourceSelectComponent
                      value={relationship['@class']}
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
                      value={relationship.targetName}
                      onChange={this.handleRelationship}
                      placeholder="Target Name"
                      limit={10}
                      name="targetName"
                      endAdornment={null}
                    />
                  </div>
                </div>
              </div>
              <IconButton
                style={{ margin: 'auto 0 auto 8px' }}
                color="primary"
                onClick={this.handleRelationshipAdd}
              >
                <AddIcon />
              </IconButton>
            </ListItem>
            <List className="relationships-list">
              {rships}
            </List>
          </Card>
          <div className="submit-button">
            <Button
              type="submit"
              variant="raised"
              color="primary"
              disabled={formIsInvalid}
            >
              {variant === 'edit' ? 'Confirm Changes' : 'Submit'}
            </Button>
          </div>
          {variant === 'edit' ? (
            <div className="delete-button">
              <Button variant="raised" onClick={this.handleDialogOpen}>
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
  node: null,
};

/**
  * @param {Object} node - node object.
  * @param {string} variant - specifies form type/function.
  * @param {function} handleNodeDelete - parent method triggered on node delete.
  * @param {function} handleNodeFinishEdit - parent method triggered when node is edited.
  */
NodeFormComponent.propTypes = {
  node: PropTypes.object,
  variant: PropTypes.string,
  handleNodeDelete: PropTypes.func,
  handleNodeFinishEdit: PropTypes.func,
};

export default NodeFormComponent;
