/**
 * @module /views/EditOntologyViewBase
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as jc from 'json-cycle';
import OntologyFormComponent from '../../components/OntologyFormComponent/OntologyFormComponent';
import api from '../../services/api';
import util from '../../services/util';
import config from '../../static/config';
import { withSchema } from '../../components/SchemaContext/SchemaContext';

const { DEFAULT_NEIGHBORS } = config;

/**
 * View for record editing. Contains a form component with the 'edit' variant
 * selected. Selects node with record ID as passed in to the url (/edit/[rid]).
 * Redirects to the home query page on form submit, or to the error page.
 */
class EditOntologyViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
      sources: [],
      edgeTypes: [],
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  async componentDidMount() {
    const { match, schema } = this.props;
    const { rid } = match.params;
    const response = await api.get(`/ontologies/${rid}?neighbors=${DEFAULT_NEIGHBORS}`);
    const node = jc.retrocycle(response).result;
    const sources = await api.getSources();
    const edgeTypes = schema.getEdges();
    this.setState({
      node,
      sources,
      edgeTypes,
    });
  }


  /**
   * Adds new edges and deletes specified ones, then patches property changes to the api.
   */
  async handleSubmit(form, relationships, originalNode) {
    const { schema } = this.props;

    const changedEdges = [];

    /* Checks for differences in original node and submitted form. */

    // Deletes edges that are no longer present on the edited node.
    originalNode.relationships.forEach((relationship) => {
      const matched = relationships.find(
        r => r.out === relationship.out
          && r.in === relationship.in
          && r['@class'] === relationship['@class']
          && r.source === relationship.source,
      );
      if (!matched || matched.deleted) {
        changedEdges.push(api.delete(
          `/${relationship['@class'].toLowerCase()}/${relationship['@rid'].slice(1)}`,
        ));
      }
    });

    // Adds new edges that were not present on the original node.
    relationships.forEach((relationship) => {
      if (
        !originalNode.relationships.find(
          r => r.out === relationship.out
            && r.in === relationship.in
            && r['@class'] === relationship['@class']
            && r.source === relationship.source,
        )
      ) {
        changedEdges.push(api.post(`/${relationship['@class'].toLowerCase()}`, {
          in: relationship.in,
          out: relationship.out,
          source: relationship.source,
        }));
      }
    });

    await Promise.all(changedEdges);
    const { route, properties } = schema.getClass(originalNode['@class']);
    const payload = util.parsePayload(form, properties);
    console.log(payload);
    await api.patch(`${route}/${originalNode['@rid'].slice(1)}`, payload);
  }

  /**
   * Deletes target node.
   */
  async handleDeleteNode() {
    this.handleDialogClose();
    const { originalNode } = this.state;
    const { schema } = this.props;
    const { route } = schema.getClass(originalNode['@class']);
    await api.delete(`${route}/${originalNode['@rid'].slice(1)}`);
  }

  /**
   * Navigates back to previous view.
   */
  handleCancel() {
    const { history } = this.props;
    history.back();
  }

  /**
   * Navigates back to query page.
   */
  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  render() {
    const {
      node,
      sources,
      edgeTypes,
    } = this.state;
    const { schema } = this.props;

    if (node) {
      return (
        <OntologyFormComponent
          variant="edit"
          node={node}
          handleSubmit={this.handleSubmit}
          handleFinish={this.handleFinish}
          handleCancel={this.handleCancel}
          schema={schema}
          sources={sources}
          edgeTypes={edgeTypes}
        />
      );
    }
    return null;
  }
}

/**
 * @namespace
 * @property {Object} match - Match object for extracting URL parameters.
 * @property {Object} history - Application routing history object.
 * @property {Object} schema - Knowledgebase schema object.
 */
EditOntologyViewBase.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const EditOntologyView = withSchema(EditOntologyViewBase);

export {
  EditOntologyView,
  EditOntologyViewBase,
};
