/**
 * @module /components/OntologyFormComponent
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './OntologyFormComponent.css';
import {
  List,
  MenuItem,
  Button,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Paper,
  ListItem,
  ListItemText,
  Divider,
} from '@material-ui/core';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import FormTemplater from '../FormTemplater/FormTemplater';
import NotificationDrawer from '../NotificationDrawer/NotificationDrawer';
import util from '../../services/util';
import RelationshipsForm from '../RelationshipsForm/RelationshipsForm';

const DEFAULT_ORDER = [
  'name',
  'sourceId',
  'source',
  'description',
];
const DEFAULT_NODE_CLASS = 'Disease';
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
      deleteDialog: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleDeleteNode = this.handleDeleteNode.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleDialogOpen = this.handleDialogOpen.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Loads sources and edge types from the api, initializes fields if form is
   * an edit variant.
   */
  async componentDidMount() {
    const { node, schema, classes } = this.props;
    const { relationships } = this.state;

    let nodeClass = classes ? classes[0] : DEFAULT_NODE_CLASS;
    let originalNode = { '@class': nodeClass };
    if (node) {
      originalNode = node;
      nodeClass = node['@class'];
    }

    const form = schema.initModel(originalNode, nodeClass);

    if (originalNode.getEdges) {
      originalNode.getEdges().forEach((edge) => {
        relationships.push(schema.initModel(edge, edge['@class']));
      });
    }

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
  handleClassChange(e) {
    const { form } = this.state;
    const { schema } = this.props;
    this.setState({ form: schema.initModel(form, e.target.value) });
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
    const { schema } = this.props;
    const { name, value } = e.target;
    form[name] = value;
    if (name.includes('.data') && value) {
      form[name.split('.')[0]] = schema.newRecord(value).getPreview();
    }
    this.setState({ form });
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


  render() {
    const {
      form,
      originalNode,
      relationships,
      deleteDialog,
      loading,
      notificationDrawerOpen,
    } = this.state;
    const {
      schema,
      variant,
      handleFinish,
      classes,
    } = this.props;

    // Wait for form to get initialized
    if (!form) return null;

    const editableProps = (schema.getClass(form['@class'])).properties;
    // Validates form
    let formIsInvalid = false;
    editableProps.forEach((prop) => {
      if (prop.mandatory) {
        if (prop.type === 'link' && !(form[`${prop.name}.data`] && form[`${prop.name}.data`]['@rid'])) {
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

    return (
      <div className="node-form-wrapper">
        {dialog}
        <NotificationDrawer
          open={notificationDrawerOpen}
          loading={loading}
          handleFinish={handleFinish}
        />
        <div className="form-grid">
          <div className="flexbox">
            <Paper className="param-section" elevation={4}>
              <Typography variant="h5">
                Basic Parameters
              </Typography>
              <List component="nav">
                {variant === 'edit' || (classes && classes.length === 1) ? (
                  <React.Fragment>
                    <ListItem>
                      <ListItemText
                        primary="Class:"
                        secondary={originalNode['@class']}
                        secondaryTypographyProps={{ variant: 'h6', color: 'default' }}
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
                          resources={classes || schema.getOntologies().filter(o => o.name !== 'Ontology')}
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
                  propSchemas={editableProps}
                  schema={schema}
                  onChange={this.handleFormChange}
                  sort={util.sortFields(DEFAULT_ORDER)}
                  pairs={{
                    range: ['start', 'end'],
                    sourceId: ['sourceId', 'sourceIdVersion'],
                    trialRange: ['startYear', 'completionYear'],
                    location: ['country', 'city'],
                  }}
                />
              </List>
            </Paper>
            <Paper className="param-section forms-lists" elevation={4}>
              <RelationshipsForm
                schema={schema}
                relationships={relationships}
                nodeRid={form['@rid']}
                name="relationships"
                onChange={this.handleChange}
              />
            </Paper>
          </div>
          <Paper className="form-btns" elevation={4}>
            {variant === 'edit' && (
              <Button
                variant="contained"
                onClick={this.handleDialogOpen}
                id="delete-btn"
                size="large"
              >
                Delete
              </Button>
            )}
            <Button
              type="submit"
              onClick={this.handleSubmit}
              variant="contained"
              color="primary"
              disabled={formIsInvalid}
              id="submit-btn"
              size="large"
            >
              {variant === 'edit' ? 'Confirm Changes' : 'Submit'}
            </Button>
          </Paper>
        </div>
      </div>
    );
  }
}

/**
 * @namespace
 * @property {Object} node - node object to be edited.
 * @property {string} variant - specifies form type/function.
 * @property {Array} sources - List of Knowledgebase ontology sources.
 * @property {Object} schema - Knowledgebase db schema.
 * @property {Array} edgeTypes - List of Knowledgebase ontology edge classes.
 * @property {function} handleFinish - Function triggered when node is edited
 * or deleted.
 * @property {function} handleCancel - Function triggered when form action is
 * cancelled.
 * @property {function} handleSubmit - Function triggered when form is submitted.
 */
OntologyFormComponent.propTypes = {
  node: PropTypes.object,
  variant: PropTypes.oneOf(['edit', 'add']),
  schema: PropTypes.object.isRequired,
  handleFinish: PropTypes.func,
  handleSubmit: PropTypes.func,
  classes: PropTypes.array,
};

OntologyFormComponent.defaultProps = {
  variant: 'edit',
  handleFinish: null,
  handleSubmit: null,
  node: null,
  classes: null,
};

export default OntologyFormComponent;
