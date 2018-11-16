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

const DEFAULT_REVIEW_STATUS = 'pending';

class StatementFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      relationships: [],
      form: null,
      originalRelationships: null,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
      node.getEdges().forEach((edge) => {
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
    const { onSubmit } = this.props;
    this.setState({ loading: true, notificationDrawerOpen: true });
    await onSubmit(form, relationships, originalRelationships);
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
      form[name.split('.')[0]] = schema.newRecord(value).getPreview();
    }
    this.setState({ form });
  }

  render() {
    const {
      form,
      relationships,
      notificationDrawerOpen,
      loading,
    } = this.state;
    const {
      schema,
      handleFinish,
      onDelete,
      node,
    } = this.props;

    if (!form) return null;
    let formIsInvalid = false;
    const oneOfEachEdge = relationships.some(r => r['@class'] === 'SupportedBy' && !r.deleted)
      && relationships.some(r => r['@class'] === 'Implies' && !r.deleted);
    schema.getClass('Statement').properties.forEach((prop) => {
      if (prop.mandatory) {
        if (prop.type === 'link' && !(form[`${prop.name}.data`] && form[`${prop.name}.data`]['@rid'])) {
          formIsInvalid = true;
        } else if (prop.type !== 'boolean' && !form[prop.name]) {
          formIsInvalid = true;
        }
      }
    });

    if (!oneOfEachEdge) {
      formIsInvalid = true;
    }

    return (
      <div>
        <NotificationDrawer
          open={notificationDrawerOpen}
          loading={loading}
          handleFinish={handleFinish}
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
                propSchemas={schema.getClass('Statement').properties}
                onChange={this.handleChange}
                excludedProps={node ? undefined : ['reviewStatus', 'reviewComment']}

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
              edgeTypes={['Implies', 'SupportedBy']}
              errorMsg="Statements need at least 1 Implication edge and 1 Support edge"
              error={!oneOfEachEdge && relationships.length > 0}
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
            disabled={formIsInvalid}
          >
            Submit
          </Button>
          {node && (
            <Button
              onClick={onDelete}
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
 * @property {function} handleFinish - Handler for when form has been
 * successfully submitted.
 */
StatementFormComponent.propTypes = {
  schema: PropTypes.object.isRequired,
  node: PropTypes.object,
  onSubmit: PropTypes.func,
  handleFinish: PropTypes.func,
  onDelete: PropTypes.func,
};

StatementFormComponent.defaultProps = {
  node: null,
  onSubmit: null,
  handleFinish: null,
  onDelete: null,
};

export default StatementFormComponent;
