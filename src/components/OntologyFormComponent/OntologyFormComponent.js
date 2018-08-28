/**
 * @module /components/OntologyFormComponent
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './OntologyFormComponent.css';
import {
  TextField,
  List,
  ListItem,
  IconButton,
  MenuItem,
  Button,
  Typography,
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
  Paper,
  InputAdornment,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LinearProgress,
  Drawer,
  CircularProgress,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import RefreshIcon from '@material-ui/icons/Refresh';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import HelpIcon from '@material-ui/icons/Help';
import CheckIcon from '@material-ui/icons/Check';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import api from '../../services/api';
import util from '../../services/util';

const NOTIFICATION_SPINNER_SIZE = 16;

/**
 * Component for editing or adding database nodes. Is also used to add or
 * delete edges from the database. All changes are staged and not
 * published to the database until the form is valid and submit button
 * has been clicked.
 */
class OntologyFormComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      originalNode: null,
      form: null,
      edgeTypes: [],
      sources: [],
      newNodeClass: 'Disease',
      relationships: [],
      relationship: {
        '@class': '',
        name: '',
        sourceId: '',
        in: '',
        out: -1,
        source: '',
      },
      subset: '',
      deletedSubsets: [],
      deleteDialog: false,
      errorFlag: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleDeleteNode = this.handleDeleteNode.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleDialogOpen = this.handleDialogOpen.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.handleRelationship = this.handleRelationship.bind(this);
    this.handleRelationshipAdd = this.handleRelationshipAdd.bind(this);
    this.handleRelationshipDelete = this.handleRelationshipDelete.bind(this);
    this.handleRelationshipDirection = this.handleRelationshipDirection.bind(this);
    this.handleRelationshipUndo = this.handleRelationshipUndo.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubsetAdd = this.handleSubsetAdd.bind(this);
    this.handleSubsetDelete = this.handleSubsetDelete.bind(this);
    this.handleSubsetUndo = this.handleSubsetUndo.bind(this);
  }

  /**
   * Loads sources and edge types from the api, initializes fields if form is
   * an edit variant.
   */
  async componentDidMount() {
    const sources = await api.getSources();
    const schema = await api.getSchema();
    const { node } = this.props;
    const { relationships, relationship, newNodeClass } = this.state;

    let originalNode = { '@rid': -1 };
    let nodeClass = newNodeClass;

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

      // TODO: maybe refactor this for edges pointing to ontologies/other
      // records that don't have names or source ids.
      switch (type) {
        case 'embeddedset':
          form[name] = (originalNode[name] || []).slice();
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
          form[name] = originalNode[name] || (defaultValue || '').toString() === 'true';
          break;
        default:
          form[name] = originalNode[name] || defaultValue || '';
          break;
      }
    });
    const edgeTypes = api.getEdges(schema);
    const expandedEdgeTypes = util.expandEdges(edgeTypes);

    expandedEdgeTypes.forEach((type) => {
      if (originalNode[type]) {
        originalNode[type].forEach((edge) => {
          const targetNode = edge.out['@rid'] === originalNode['@rid']
            ? edge.in
            : edge.out;

          if (targetNode['@class'] !== 'Statement') { // TODO: remove filter for Statements.
            if (!relationships.find(r => r['@rid'] === edge['@rid'])) {
              relationships.push({
                '@rid': edge['@rid'],
                in: edge.in['@rid'],
                out: edge.out['@rid'],
                '@class': edge['@class'],
                name: targetNode.name,
                sourceId: targetNode.sourceId,
                source: edge.source['@rid'] || edge.source,
              });
            }
          }
        });
      }
    });

    // Shallow copy the array to avoid mutating it.
    originalNode.relationships = relationships.slice(0);

    this.setState({
      form,
      relationships,
      originalNode,
      sources,
      edgeTypes,
      editableProps,
      newNodeClass: nodeClass,
      ontologyTypes: api.getOntologies(schema),
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

    const newEdges = [];
    const payload = util.parsePayload(form, editableProps);
    const { route } = await api.getClass(newNodeClass);
    const response = await api.post(`${route}`, { ...payload });

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

    const changedEdges = [];

    /* Checks for differences in original node and submitted form. */

    // Deletes edges that are no longer present on the edited node.
    originalNode.relationships.forEach((initRelationship) => {
      const matched = relationships.find(
        r => r.out === initRelationship.out
          && r.in === initRelationship.in
          && r['@class'] === initRelationship['@class']
          && r.source === initRelationship.source,
      );
      if (!matched || matched.deleted) {
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
    const { route } = await api.getClass(originalNode['@class']);

    await api.patch(`${route}/${originalNode['@rid'].slice(1)}`, { ...payload });
  }

  /**
   * Changes state base on user input.
   * @param {Event} e - user input event.
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  /**
   * Re renders form input fields based on class editable properties.
   * @param {Event} e - User class selection event.
   */
  async handleClassChange(e) {
    const editableProps = (await api.getClass(e.target.value)).properties;
    const { form } = this.state;
    editableProps.forEach((prop) => {
      const {
        name,
        type,
        defaultValue,
      } = prop;
      if (!form[name]) {
        switch (type) {
          case 'embeddedset':
            form[name] = [];
            break;
          case 'boolean':
            form[name] = defaultValue.toString() === 'true';
            break;
          default:
            form[name] = '';
            break;
        }
      }
    });
    this.setState({ form, editableProps, newNodeClass: e.target.value });
  }

  /**
   * Deletes target node.
   */
  async handleDeleteNode() {
    this.setState({ notificationDrawerOpen: true, loading: true });
    this.handleDialogClose();
    const { originalNode } = this.state;
    const { route } = await api.getClass(originalNode['@class']);
    await api.delete(`${route}/${originalNode['@rid'].slice(1)}`);
    this.setState({ loading: false });
  }

  /**
   * Closes node deletion dialog.
   */
  handleDialogClose() {
    this.setState({ deleteDialog: false });
  }

  /**
   * Opens node deletion dialog.
   */
  handleDialogOpen() {
    this.setState({ deleteDialog: true });
  }

  /**
   * Changes form state based on user input.
   * @param {Event} e - user input event.
   */
  handleFormChange(e) {
    const { form } = this.state;
    const { name, value, sourceId } = e.target;
    form[name] = value;

    if (e.target['@rid']) {
      form[`${name}.@rid`] = e.target['@rid'];
    } else if (form[`${name}.@rid`]) {
      form[`${name}.@rid`] = '';
    }
    if (sourceId) {
      form[`${name}.sourceId`] = sourceId;
    } else if (form[`${name}.sourceId`]) {
      form[`${name}.sourceId`] = '';
    }

    this.setState({ form });
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
      relationship.sourceId = e.target.sourceId;
    }
    this.setState({ relationship, errorFlag: false });
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
          errorFlag: false,
          relationship: {
            '@class': '',
            name: '',
            sourceId: '',
            in: '',
            out: originalNode['@rid'],
            source: '',
          },
        });
      }
    } else {
      this.setState({ errorFlag: true });
    }
  }

  /**
   * Deletes a relationship from state relationship list.
   * @param {Object} relationship - Relationship to be deleted
   */
  handleRelationshipDelete(relationship) {
    const { relationships, originalNode } = this.state;
    const { variant } = this.props;
    if (variant === 'edit' && originalNode.relationships.find(r => r['@rid'] === relationship['@rid'])) {
      relationship.deleted = true;
    } else if (relationships.indexOf(relationship) !== -1) {
      relationships.splice(relationships.indexOf(relationship), 1);
    }
    this.setState({ relationships });
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
    this.setState({ relationship, errorFlag: false });
  }

  /**
   * Removes a relationship from being staged for deletion.
   * @param {Object} relationship - relationship to be rolled back.
   */
  handleRelationshipUndo(relationship) {
    const { relationships } = this.state;
    const rel = relationships.find(r => r['@rid'] === relationship['@rid']);
    delete rel.deleted;

    this.setState({ relationships });
  }

  /**
   * Submits form.
   * @param {Event} e - Submit event.
   */
  async handleSubmit(e) {
    e.preventDefault();
    const { variant } = this.props;
    this.setState({ loading: true, notificationDrawerOpen: true });

    if (!window.Cypress) {
      if (variant === 'edit') {
        await this.editSubmit();
      } else {
        await this.addSubmit();
      }
    }
    this.setState({ loading: false });
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
    const { form, originalNode, deletedSubsets } = this.state;
    const { variant } = this.props;
    if (form.subsets.indexOf(subset) !== -1) {
      form.subsets.splice(form.subsets.indexOf(subset), 1);
      if (variant === 'edit' && originalNode.subsets.includes(subset)) {
        deletedSubsets.push(subset);
      }
    }
    this.setState({ form, deletedSubsets });
  }

  handleSubsetUndo(subset) {
    const { form, deletedSubsets } = this.state;
    deletedSubsets.splice(deletedSubsets.indexOf(subset), 1);
    form.subsets.push(subset);
    this.setState({ form, deletedSubsets });
  }

  render() {
    const {
      form,
      originalNode,
      sources,
      edgeTypes,
      editableProps,
      relationship,
      relationships,
      subset,
      deleteDialog,
      newNodeClass,
      errorFlag,
      ontologyTypes,
      loading,
      notificationDrawerOpen,
      deletedSubsets,
    } = this.state;
    const { variant, handleNodeFinish } = this.props;

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
              color="primary"
              size="large"
            >
              No
            </Button>
            <Button
              onClick={this.handleDeleteNode}
              size="large"
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
                  endAdornment: description && (
                    <InputAdornment position="end">
                      <Tooltip title={description}>
                        <HelpIcon color="primary" />
                      </Tooltip>
                    </InputAdornment>
                  ),
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
          endpoint = linkedClass.route.slice(1);
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
      <Chip
        label={s}
        deleteIcon={<CloseIcon />}
        onDelete={() => this.handleSubsetDelete(s)}
        key={s}
        className="subset-chip"
      />
    ));

    subsets.push(...deletedSubsets.map(s => (
      <Chip
        label={s}
        deleteIcon={<RefreshIcon />}
        onDelete={() => this.handleSubsetUndo(s)}
        key={s}
        className="subset-chip deleted-chip"
      />
    )));

    /**
      * Formats valid edge types.
      * @param {Object} edgeType - Edge type object.
      */
    const edgeTypesDisplay = (edgeType) => {
      const inOut = relationship.in === originalNode['@rid']
        ? util.getEdgeLabel(`in_${edgeType}`)
        : util.getEdgeLabel(`out_${edgeType}`);
      return (
        <MenuItem key={edgeType} value={edgeType}>
          {inOut}
        </MenuItem>
      );
    };

    const drawer = (
      <Drawer
        open={notificationDrawerOpen}
        onClose={handleNodeFinish}
        anchor="bottom"
        classes={{ paper: 'paper' }}
      >
        <div className="notification-drawer">
          <div className="form-linear-progress">
            <LinearProgress
              color="secondary"
              variant={loading ? 'indeterminate' : 'determinate'}
              value={loading ? 0 : 100}
            />
          </div>
          <Button
            color="secondary"
            onClick={handleNodeFinish}
            disabled={loading}
            variant="raised"
            size="large"
          >
            {loading
              ? <CircularProgress size={NOTIFICATION_SPINNER_SIZE} color="secondary" />
              : <CheckIcon />
            }
          </Button>
        </div>
      </Drawer>
    );

    return (
      <div className="node-form-wrapper">
        {dialog}
        {drawer}
        <form onSubmit={this.handleSubmit}>
          <div className="form-grid">
            <Paper className="form-header" elevation={4}>
              <Typography variant="headline" className="form-title">
                {variant === 'edit' ? 'Edit Ontology Term'
                  : 'Add New Ontology Term'}
              </Typography>
              <div className="form-cancel-btn">
                <Button
                  color="default"
                  onClick={handleNodeFinish}
                  variant="outlined"
                >
                  Cancel
                </Button>
              </div>
            </Paper>
            <div className="flexbox">
              <Paper className="param-section" elevation={4}>
                <Typography variant="title">
                  Basic Parameters
                </Typography>
                {variant === 'edit' ? (
                  <div style={{ padding: '8px 24px' }}>
                    <Typography variant="subheading">
                      Class:
                    </Typography>
                    <Typography variant="caption">
                      {originalNode['@class']}
                    </Typography>
                  </div>
                )
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
              </Paper>
              <Paper className="param-section forms-lists" elevation={4}>
                <Paper className="subsets-wrapper">
                  <Typography variant="title">
                    Subsets
                  </Typography>
                  <div className="input-wrapper">
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
                  </div>
                  <List className="subsets-list">
                    {subsets}
                  </List>
                </Paper>
                <Paper className="relationships-wrapper">
                  <Typography variant="title">
                    Relationships
                  </Typography>
                  <div style={{ overflow: 'auto' }}>
                    <Table className="form-table">
                      <TableHead className="form-table-header">
                        <TableRow>
                          <TableCell padding="checkbox" />
                          <TableCell padding="dense">
                            Class
                          </TableCell>

                          <TableCell padding="dense">
                            Related Record
                          </TableCell>
                          <TableCell padding="dense">
                            Source
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relationships.map((r) => {
                          const sourceName = sources.find(
                            s => s['@rid'] === r.source,
                          ).name;
                          const typeName = r.in === originalNode['@rid']
                            ? util.getEdgeLabel(`in_${r['@class']}`)
                            : util.getEdgeLabel(`out_${r['@class']}`);
                          return (
                            <TableRow
                              key={r['@rid'] || `${r['@class']}${r.in}${r.out}${r.source}`}
                              className={r.deleted && 'deleted'}
                            >
                              <TableCell padding="checkbox">
                                {!r.deleted ? (
                                  <IconButton
                                    onClick={() => this.handleRelationshipDelete(r)}
                                    style={{ position: 'unset' }}
                                    disableRipple
                                  >
                                    <CloseIcon color="error" />
                                  </IconButton>)
                                  : (
                                    <IconButton
                                      onClick={() => this.handleRelationshipUndo(r)}
                                      style={{ position: 'unset' }}
                                      disableRipple
                                      color="primary"
                                    >
                                      <RefreshIcon />
                                    </IconButton>
                                  )
                                }
                              </TableCell>
                              <TableCell padding="dense">
                                {typeName}
                              </TableCell>
                              <TableCell padding="dense">
                                {util.getPreview(r)}
                              </TableCell>
                              <TableCell padding="dense">
                                {sourceName}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow id="relationship-add">
                          <TableCell padding="checkbox">
                            <IconButton
                              color="primary"
                              onClick={this.handleRelationshipAdd}
                            >
                              <AddIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell padding="dense">
                            <div className="relationship-dir-type">
                              <IconButton
                                disableRipple
                                name="direction"
                                onClick={this.handleRelationshipDirection}
                                color="primary"
                              >
                                <TrendingFlatIcon
                                  className={
                                    (relationship.in === originalNode['@rid'])
                                      ? 'relationship-in'
                                      : null
                                  }
                                />
                              </IconButton>
                              <ResourceSelectComponent
                                value={relationship['@class']}
                                onChange={this.handleRelationship}
                                name="@class"
                                label="Type"
                                resources={edgeTypes}
                                error={errorFlag}
                                id="relationship-type"
                                dense
                              >
                                {edgeTypesDisplay}
                              </ResourceSelectComponent>
                            </div>
                          </TableCell>
                          <TableCell padding="dense">
                            <div className="search-wrap">
                              <AutoSearchComponent
                                value={relationship.name}
                                onChange={this.handleRelationship}
                                placeholder="Target Name"
                                limit={10}
                                name="name"
                                error={errorFlag}
                                dense
                              />
                            </div>
                          </TableCell>
                          <TableCell padding="dense" style={{ transform: 'translate(0, 1px)' }}>
                            <ResourceSelectComponent
                              value={relationship.source}
                              onChange={this.handleRelationship}
                              name="source"
                              label="Source"
                              resources={sources}
                              error={errorFlag}
                              dense
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Paper>
              </Paper>
            </div>
            <Paper className="form-btns" elevation={4}>
              {variant === 'edit' && (
                <Button
                  variant="raised"
                  onClick={this.handleDialogOpen}
                  id="delete-btn"
                  size="large"
                >
                  Delete Ontology
                </Button>
              )}
              <Button
                type="submit"
                variant="raised"
                color="primary"
                disabled={formIsInvalid}
                id="submit-btn"
                size="large"
              >
                {variant === 'edit' ? 'Confirm Changes' : 'Submit Ontology'}
              </Button>
            </Paper>
          </div>
        </form>
      </div>
    );
  }
}

OntologyFormComponent.propTypes = {
  /**
   * @param {Object} node - node object to be edited.
   */
  node: PropTypes.object,
  /**
   * @param {string} variant - specifies form type/function.
   */
  variant: PropTypes.string,
  /**
   * @param {function} handleNodeFinish - parent method triggered when node is
   * edited or deleted.
   */
  handleNodeFinish: PropTypes.func,
};

OntologyFormComponent.defaultProps = {
  variant: 'edit',
  handleNodeFinish: null,
  node: null,
};

export default OntologyFormComponent;
