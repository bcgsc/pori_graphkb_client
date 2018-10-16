/**
 * @module /views/AddOntologyView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OntologyFormComponent from '../../components/OntologyFormComponent/OntologyFormComponent';
import api from '../../services/api';
import util from '../../services/util';

/**
 * View for editing or adding database nodes. Includes a NodeFormComponent with the
 * 'add' variant. Submissions will post to the server, and redirect user to the home
 * query page.
 */
class AddOntologyView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      schema: null,
      sources: null,
      edgeTypes: [],
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
  }

  async componentDidMount() {
    const sources = await api.getSources();
    const schema = await api.getSchema();
    const edgeTypes = api.getEdges(schema);
    this.setState({
      schema,
      sources,
      edgeTypes,
    });
  }

  /**
  * Posts new node to the api, then posts all new edges.
  */
  async handleSubmit(form, relationships) {
    const { schema } = this.state;

    const newEdges = [];
    const payload = util.parsePayload(form, util.getClass(form['@class'], schema).properties);
    const { route } = util.getClass(form['@class'], schema);
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

  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  render() {
    const {
      schema,
      sources,
      edgeTypes,
    } = this.state;

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
 */
AddOntologyView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default AddOntologyView;
