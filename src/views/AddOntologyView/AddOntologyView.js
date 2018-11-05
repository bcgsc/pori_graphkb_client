/**
 * @module /views/AddOntologyView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
    } catch (e) { console.log(e); }
  }

  /**
   * Posts new node to the api, then posts all new edges.
   */
  async handleSubmit(form, relationships) {
    const { schema } = this.props;

    const newEdges = [];
    const kbClass = schema.getClass(form['@class']);
    const payload = util.parsePayload(form, kbClass.properties);
    const { route } = kbClass;
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
    await Promise.all(newEdges);
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
      <OntologyFormComponent
        variant="add"
        schema={schema}
        sources={sources}
        edgeTypes={edgeTypes}
        handleSubmit={this.handleSubmit}
        handleFinish={this.handleFinish}
        handleCancel={this.handleFinish}
      />
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
