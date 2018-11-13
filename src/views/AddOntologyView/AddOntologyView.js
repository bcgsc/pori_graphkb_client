/**
 * @module /views/AddOntologyView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './AddOntologyView.css';
import {
  Paper,
  Button,
  Typography,
} from '@material-ui/core';
import OntologyFormComponent from '../../components/OntologyFormComponent/OntologyFormComponent';
import api from '../../services/api';
import util from '../../services/util';
import { withSchema } from '../../components/SchemaContext/SchemaContext';

/**
 * View for editing or adding database nodes. Includes a NodeFormComponent with the
 * 'add' variant. Submissions will post to the server, and redirect user to the home
 * query page.
 */
class AddOntologyViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sources: [],
      edgeTypes: [],
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
  }

  /**
   * Collects schema, sources, and knowledgebase edge types.
   */
  async componentDidMount() {
    const { schema } = this.props;
    try {
      const sources = await api.getSources();
      const edgeTypes = schema.getEdges();
      this.setState({
        sources,
        edgeTypes,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }

  /**
   * Posts new node to the api, then posts all new edges.
   */
  async handleSubmit(form, relationships) {
    const { schema } = this.props;

    const kbClass = schema.getClass(form['@class']);
    const payload = util.parsePayload(form, kbClass.properties);
    const { route } = kbClass;
    const response = await api.post(route, { ...payload });
    await api.submitEdges(relationships, schema, response.result['@rid']);
  }

  /**
   * Navigates user back to query page.
   */
  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  render() {
    const {
      sources,
      edgeTypes,
    } = this.state;
    const { schema } = this.props;

    return schema && (
      <div className="add-form-wrapper">
        <Paper className="form-header" elevation={4}>
          <div className="form-cancel-btn">
            <Button
              color="default"
              onClick={this.handleFinish}
              variant="outlined"
            >
              Cancel
            </Button>
          </div>
          <Typography variant="h5" className="form-title">
            Add New Ontology Term
          </Typography>
        </Paper>
        <OntologyFormComponent
          variant="add"
          schema={schema}
          sources={sources}
          edgeTypes={edgeTypes}
          handleSubmit={this.handleSubmit}
          handleFinish={this.handleFinish}
        />
      </div>
    );
  }
}

/**
 * @namespace
 * @property {Object} history - history state object.
 * @property {Object} schema - Knowledgebase schema object.
 */
AddOntologyViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const AddOntologyView = withSchema(AddOntologyViewBase);

/**
 * Export consumer component and regular component for testing.
 */
export {
  AddOntologyView,
  AddOntologyViewBase,
};


export default AddOntologyViewBase;
