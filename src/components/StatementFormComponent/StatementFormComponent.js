/**
 * @module /components/StatementFormComponent
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './StatementFormComponent.css';
import {
  Button,
  Paper,
  Typography,
} from '@material-ui/core';
import FormTemplater from '../FormTemplater/FormTemplater';
import RelationshipsForm from '../RelationshipsForm/RelationshipsForm';
import NotificationDrawer from '../NotificationDrawer/NotificationDrawer';
import DeleteRecordDialog from '../DeleteRecordDialog/DeleteRecordDialog';

const DEFAULT_REVIEW_STATUS = 'pending';

/**
 * Form for Statement records. Shows shorthand as a mix of the appliesTo
 * Ontology, relevance Vocabulary, as well as source and sourceId.
 */
class StatementFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      relationships: [],
      form: null,
      originalRelationships: null,
      deleteDialog: false,
      errorFields: [],
      relationshipsError: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDialog = this.handleDialog.bind(this);
    this.handleDeleteNode = this.handleDeleteNode.bind(this);
  }

  /**
   * Initializes form model and relationships.
   */
  async componentDidMount() {
    const { node, schema } = this.props;
    const { relationships } = this.state;

    const originalNode = node || {};

    const form = schema.initModel(originalNode, 'Statement');
    if (node) {
      schema.getEdges(node).forEach((edge) => {
        relationships.push(schema.initModel(edge, edge['@class']));
      });
    } else {
      form.reviewStatus = DEFAULT_REVIEW_STATUS;
    }
    // Shallow copy the array to avoid mutating it.
    const originalRelationships = relationships.slice(0);

    this.setState({
      form,
      relationships,
      originalRelationships,
    });
  }

  /**
   * Calls parent submit method and opens notification drawer. Shows completed
   * icon when submission handler has completed.
   */
  async handleSubmit() {
    const { form, relationships, originalRelationships } = this.state;
    const { onSubmit, schema } = this.props;

    let formIsInvalid = false;
    const errorFields = [];
    const oneOfEachEdge = relationships.some(r => r['@class'] === 'SupportedBy' && !r.deleted)
      && relationships.some(r => r['@class'] === 'ImpliedBy' && !r.deleted);
    schema.getProperties('Statement').forEach((prop) => {
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
    if (formIsInvalid || !oneOfEachEdge) {
      const update = {};
      if (formIsInvalid) {
        update.errorFields = errorFields;
      }
      if (!oneOfEachEdge) {
        update.relationshipsError = true;
      }
      this.setState(update);
    } else {
      this.setState({ loading: true, notificationDrawerOpen: true });
      if (await onSubmit(form, relationships, originalRelationships)) {
        this.setState({ loading: false });
      } else {
        this.setState({ notificationDrawerOpen: false });
      }
    }
  }

  /**
   * Sets the open state of the delete dialog.
   * @param {boolean} val - Open state of delete dialog.
   */
  handleDialog(val) {
    this.setState({ deleteDialog: val });
  }

  /**
   * Deletes target node.
   */
  async handleDeleteNode() {
    const { onDelete } = this.props;
    this.setState({ notificationDrawerOpen: true, loading: true });
    this.handleDialog(false);
    await onDelete();
    this.setState({ loading: false });
  }

  /**
   * Updates form model based off user input.
   * @param {Event} e - User input event.
   */
  handleChange(e) {
    const { form } = this.state;
    const { schema } = this.props;
    const { name, value } = e.target;
    form[name] = value;
    if (name.includes('.data') && value) {
      form[name.split('.')[0]] = schema.getPreview(value);
    }
    this.setState({ form, relationshipsError: false, errorFields: [] });
  }

  render() {
    const {
      form,
      relationships,
      notificationDrawerOpen,
      loading,
      deleteDialog,
      errorFields,
      relationshipsError,
    } = this.state;
    const {
      schema,
      onFinish,
      node,
      is409,
    } = this.props;

    if (!form) return null;

    const oneOfEachEdge = relationships.some(r => r['@class'] === 'SupportedBy' && !r.deleted)
      && relationships.some(r => r['@class'] === 'ImpliedBy' && !r.deleted);

    return (
      <div>
        <DeleteRecordDialog
          open={deleteDialog}
          onDelete={this.handleDeleteNode}
          onClose={() => this.handleDialog(false)}
        />
        <NotificationDrawer
          open={notificationDrawerOpen}
          loading={loading}
          onFinish={onFinish}
        />
        <div className="statement-form-wrapper">
          <div className="statement-form-node">
            <Paper className="statement-preview">
              <Typography>
                {form.sourceId && form.sourceId}
              </Typography>
              {(form.relevance || form.appliesTo)
                ? (
                  <Typography variant="h5">
                    {`${form.relevance} to ${form.appliesTo}`}
                  </Typography>
                ) : (
                  <Typography variant="h5" color="textSecondary">
                    <i>Statement preview</i>
                  </Typography>
                )}
              <Typography color="textSecondary">
                {form.source && `(${form.source})`}
              </Typography>
            </Paper>
            <Paper className="statement-form-params">
              <FormTemplater
                model={form}
                schema={schema}
                propSchemas={schema.getProperties('Statement')}
                onChange={this.handleChange}
                excludedProps={node ? undefined : ['reviewStatus', 'reviewComment']}
                errorFields={errorFields}
              />
            </Paper>
          </div>
          <Paper className="statement-form-relationships">
            <RelationshipsForm
              relationships={relationships}
              schema={schema}
              nodeRid={form['@rid']}
              onChange={this.handleChange}
              name="relationships"
              edgeTypes={[
                {
                  name: 'ImpliedBy',
                  direction: 'out',
                  endpoint: '/ontologies',
                  superClass: 'Biomarker',
                },
                {
                  name: 'SupportedBy',
                  direction: 'out',
                  superClass: 'Evidence',
                  endpoint: '/evidence',
                },
              ]}
              errorMsg="Statements need at least 1 Implication edge and 1 Support edge"
              error={(!oneOfEachEdge && relationships.length > 0) || relationshipsError}
              overridePristine={relationshipsError}
            />
          </Paper>
        </div>
        <Paper className="statement-form-btns">
          <Button
            onClick={this.handleSubmit}
            variant="contained"
            color="primary"
            size="large"
            id="statement-submit-btn"
          >
            Submit
          </Button>
          {is409 && (
            <Typography
              style={{ margin: 'auto', marginRight: 8 }}
              color="error"
            >
              Record already exists
            </Typography>
          )}
          {node && (
            <Button
              onClick={() => this.handleDialog(true)}
              variant="contained"
              size="large"
              id="statement-delete-btn"
            >
              Delete
            </Button>
          )}
        </Paper>
      </div>
    );
  }
}

/**
 * @namespace
 * @property {Object} schema - Knowledgebase db schema
 * @property {Object} node - Existing Statement record to be edited. If not
 * included, form will generate a clean model to post.
 * @property {function} onSubmit - Handler for when form is submitted.
 * @property {function} onFinish - Handler for when form has been
 * successfully submitted.
 * @property {function} onDelete - Handler for when record has been deleted.
 */
StatementFormComponent.propTypes = {
  schema: PropTypes.object.isRequired,
  node: PropTypes.object,
  onSubmit: PropTypes.func,
  onFinish: PropTypes.func,
  onDelete: PropTypes.func,
  is409: PropTypes.bool,
};

StatementFormComponent.defaultProps = {
  node: null,
  onSubmit: null,
  onFinish: null,
  onDelete: null,
  is409: false,
};

export default StatementFormComponent;
