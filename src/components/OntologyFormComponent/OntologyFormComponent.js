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
  Paper,
  ListItem,
  ListItemText,
  Divider,
} from '@material-ui/core';
import DeleteRecordDialog from '../DeleteRecordDialog';
import FormTemplater from '../FormTemplater';
import NotificationDrawer from '../NotificationDrawer';
import RelationshipsForm from '../RelationshipsForm';
import ResourceSelectComponent from '../ResourceSelectComponent';
import util from '../../services/util';

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
 * has been clicked. This form is the most basic of the different form types,
 * and essentially just manages a classmodel and its generated form.
 * It can be used for any basic form that does not require any special input
 * features. This is the reason this form is used for CategoryVariants even
 * though they are not Ontologies.
 */
class OntologyFormComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      originalNode: null,
      form: null,
      relationships: [],
      deleteDialog: false,
      errorFields: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleDeleteNode = this.handleDeleteNode.bind(this);
    this.handleDialog = this.handleDialog.bind(this);
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

    if (originalNode) {
      schema.getEdges(originalNode).forEach((edge) => {
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
   * @param {Event} event - user input event.
   */
  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  /**
   * Re renders form input fields based on class editable properties.
   * @param {Event} event - User class selection event.
   */
  handleClassChange(event) {
    const { form } = this.state;
    const { schema } = this.props;
    this.setState({ form: schema.initModel(form, event.target.value) });
  }

  /**
   * Deletes target node.
   */
  async handleDeleteNode() {
    const { handleDelete } = this.props;
    this.setState({ notificationDrawerOpen: true, loading: true });
    this.handleDialog(false);
    await handleDelete();
    this.setState({ loading: false });
  }

  /**
   * Sets the open state of the delete dialog.
   * @param {boolean} val - Open state of delete dialog.
   */
  handleDialog(val) {
    this.setState({ deleteDialog: val });
  }

  /**
   * Changes form state based on user input.
   * @param {Event} event - user input event.
   */
  handleFormChange(event) {
    const { form } = this.state;
    const { schema } = this.props;
    const { name, value } = event.target;
    form[name] = value;
    if (name.includes('.data') && value) {
      form[name.split('.')[0]] = schema.getPreview(value);
    }
    this.setState({ form, errorFields: [] });
  }

  /**
   * Validates form and calls submission parent method with the form and
   * relationships data.
   * @param {Event} event - Submit event.
   */
  async handleSubmit(event) {
    event.preventDefault();
    const { form, relationships, originalNode } = this.state;
    const { handleSubmit, schema } = this.props;

    const editableProps = schema.getProperties(form);
    // Validates form
    let formIsInvalid = false;
    const errorFields = [];
    editableProps.forEach((prop) => {
      if (prop.mandatory) {
        if (prop.type === 'link' && !(form[`${prop.name}.data`] && form[`${prop.name}.data`]['@rid'])) {
          errorFields.push(prop.name);
          formIsInvalid = true;
        } else if (prop.type !== 'boolean' && !form[prop.name]) {
          errorFields.push(prop.name);
          formIsInvalid = true;
        }
      }
    });
    if (formIsInvalid) {
      this.setState({ errorFields });
    } else {
      this.setState({ loading: true, notificationDrawerOpen: true });
      if (await handleSubmit(form, relationships, originalNode)) {
        this.setState({ loading: false });
      } else {
        this.setState({ notificationDrawerOpen: false });
      }
    }
  }


  render() {
    const {
      form,
      originalNode,
      relationships,
      deleteDialog,
      loading,
      notificationDrawerOpen,
      errorFields,
    } = this.state;
    const {
      schema,
      variant,
      handleFinish,
      classes,
      is409,
    } = this.props;

    // Wait for form to get initialized
    if (!form) return null;

    const editableProps = schema.getProperties(form);

    return (
      <div className="node-form-wrapper">
        <DeleteRecordDialog
          open={deleteDialog}
          onDelete={this.handleDeleteNode}
          onClose={() => this.handleDialog(false)}
        />
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
                  errorFields={errorFields}
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
                onClick={() => this.handleDialog(true)}
                id="delete-btn"
                size="large"
              >
                Delete
              </Button>
            )}
            {is409 && (
              <Typography
                style={{ margin: 'auto', marginRight: 8 }}
                color="error"
              >
                Record already exists
              </Typography>
            )}
            <Button
              onClick={this.handleSubmit}
              variant="contained"
              color="primary"
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
 * @property {Object} schema - Knowledgebase db schema.
 * @property {function} handleFinish - Function triggered when node is edited
 * or deleted.
 * @property {function} handleSubmit - Function triggered when form is
 * submitted.
 * @property {function} handleDelete - Function triggered when ontology is
 * deleted.
 * @property {Array.<Object>} classes - list of possible classes for form.
 * @property {boolean} is409 - flag for whether previous submission was a 409.
 */
OntologyFormComponent.propTypes = {
  node: PropTypes.object,
  variant: PropTypes.oneOf(['edit', 'add']),
  schema: PropTypes.object.isRequired,
  handleFinish: PropTypes.func,
  handleSubmit: PropTypes.func,
  handleDelete: PropTypes.func,
  classes: PropTypes.array,
  is409: PropTypes.bool,
};

OntologyFormComponent.defaultProps = {
  variant: 'edit',
  handleFinish: null,
  handleSubmit: null,
  handleDelete: null,
  node: null,
  classes: null,
  is409: false,
};

export default OntologyFormComponent;
