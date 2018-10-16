/**
 * @module /components/OntologyFormComponent
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './OntologyFormComponent.css';
import {
  TextField,
  List,
  IconButton,
  MenuItem,
  Button,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Paper,
  InputAdornment,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ListItem,
  ListItemText,
  Divider,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import RefreshIcon from '@material-ui/icons/Refresh';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import util from '../../services/util';
import FormTemplater from '../FormTemplater/FormTemplater';
import NotificationDrawer from '../NotificationDrawer/NotificationDrawer';

const DEFAULT_ORDER = [
  'name',
  'sourceId',
  'source',
  'description',
];

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
    const { node, edgeTypes, schema } = this.props;
    const { relationships, relationship } = this.state;

    let originalNode = { '@rid': -1 };
    let nodeClass = DEFAULT_NODE_CLASS;

    if (node) {
      originalNode = node;
      nodeClass = node['@class'];
      relationship.out = node['@rid'];
    }

    const form = util.initModel(originalNode, nodeClass, schema);
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
    });
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
    const { form, schema } = this.state;
    this.setState({ form: util.initModel(form, e.target.value, schema) });
  }

  /**
 * Deletes target node.
 */
  async handleDeleteNode() {
    this.setState({ notificationDrawerOpen: true, loading: true });
    this.handleDialogClose();
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
   * @param {number} i - Relationship index to be deleted
   */
  handleRelationshipDelete(i) {
    const { relationships, originalNode } = this.state;
    const { variant } = this.props;
    if (
      variant === 'edit'
      && originalNode.relationships.find(r => r['@rid'] === relationships[i]['@rid'])
    ) {
      relationships[i].deleted = true;
    } else {
      relationships.splice(i, 1);
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
    const { form, relationships, originalNode } = this.state;
    const { handleSubmit } = this.props;
    this.setState({ loading: true, notificationDrawerOpen: true });

    await handleSubmit(form, relationships, originalNode);
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

  /**
   * Reverts a subset that is staged for deletion.
   * @param {string} subset - deleted subset to be reverted.
   */
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
      relationship,
      relationships,
      subset,
      deleteDialog,
      errorFlag,
      loading,
      notificationDrawerOpen,
      deletedSubsets,
    } = this.state;
    const {
      sources,
      schema,
      edgeTypes,
      variant,
      handleFinish,
      handleCancel,
    } = this.props;

    // Wait for form to get initialized
    if (!form) return null;

    const editableProps = (util.getClass(form['@class'], schema)).properties;

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
     * Formats model subsets into list form.
     */
    const subsets = (form.subsets || [])
      .sort((a, b) => a > b ? 1 : -1)
      .map(s => (
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

    return (
      <div className="node-form-wrapper">
        {dialog}
        <NotificationDrawer
          open={notificationDrawerOpen}
          loading={loading}
          handleFinish={handleFinish}
        />
        <form onSubmit={this.handleSubmit}>
          <div className="form-grid">
            <Paper className="form-header" elevation={4}>
              <div className="form-cancel-btn">
                <Button
                  color="default"
                  onClick={handleCancel}
                  variant="outlined"
                >
                  Cancel
                </Button>
              </div>
              <Typography variant="headline" className="form-title">
                {variant === 'edit' ? 'Edit Ontology Term'
                  : 'Add New Ontology Term'}
              </Typography>
            </Paper>
            <div className="flexbox">
              <Paper className="param-section" elevation={4}>
                <Typography variant="title">
                  Basic Parameters
                </Typography>
                <List component="nav">
                  {variant === 'edit' ? (
                    <React.Fragment>
                      <ListItem>
                        <ListItemText
                          primary="Class:"
                          secondary={originalNode['@class']}
                          secondaryTypographyProps={{ variant: 'title', color: 'default' }}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  )
                    : (
                      <React.Fragment>
                        <ListItem>
                          <ResourceSelectComponent
                            value={form['@class']}
                            onChange={this.handleClassChange}
                            name="newNodeClass"
                            label="Class"
                            variant="filled"
                            resources={util.getOntologies(schema)}
                          >
                            {resource => (
                              <MenuItem key={resource.name} value={resource.name}>
                                {util.antiCamelCase(resource.name)}
                              </MenuItem>
                            )}
                          </ResourceSelectComponent>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    )}
                  <FormTemplater
                    model={form}
                    kbClass={editableProps}
                    schema={schema}
                    onChange={this.handleFormChange}
                    excludedProps={['subsets']}
                    sort={util.sortFields(DEFAULT_ORDER)}
                  />
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
                        {relationships.map((r, i) => {
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
                                    onClick={() => this.handleRelationshipDelete(i)}
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
                          <TableCell padding="checkbox" id="add-btn-cell">
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

/**
 * @namespace
 * @property {Object} node - node object to be edited.
 * @property {string} variant - specifies form type/function.
 * @property {function} handleNodeFinish - parent method triggered when node is
 * edited or deleted.
 * @property {function} handleCancel - parent method triggered when form action is cancelled.
 */
OntologyFormComponent.propTypes = {
  sources: PropTypes.array,
  schema: PropTypes.object.isRequired,
  edgeTypes: PropTypes.array,
  node: PropTypes.object,
  variant: PropTypes.string,
  handleFinish: PropTypes.func,
  handleCancel: PropTypes.func,
  handleSubmit: PropTypes.func,
};

OntologyFormComponent.defaultProps = {
  sources: [],
  edgeTypes: [],
  variant: 'edit',
  handleFinish: null,
  handleCancel: null,
  handleSubmit: null,
  node: null,
};

export default OntologyFormComponent;
