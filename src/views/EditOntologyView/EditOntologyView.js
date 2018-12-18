/**
 * @module /views/EditOntologyView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './EditOntologyView.css';
import {
  Paper,
  Button,
  Typography,
} from '@material-ui/core';
import * as jc from 'json-cycle';
import { withKB } from '../../components/KBContext';
import OntologyFormComponent from '../../components/OntologyFormComponent';
import api from '../../services/api';
import util from '../../services/util';
import config from '../../static/config';

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
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  async componentDidMount() {
    const { match } = this.props;
    const { rid } = match.params;
    const response = await api.get(`/ontologies/${rid}?neighbors=${DEFAULT_NEIGHBORS}`);
    const node = jc.retrocycle(response).result;
    this.setState({
      node,
    });
  }


  /**
   * Adds new edges and deletes specified ones, then PATCHes property changes
   * to the api.
   * @param {Object} form - completed form object.
   * @param {Array.<Object>} relationships - List of relationship data.
   * @param {Object} originalNode - Original node data.
   * @return {boolean} true if submission is successful.
   */
  async handleSubmit(form, relationships, originalNode) {
    const { schema } = this.props;

    try {
      await api.patchEdges(originalNode.relationships || [], relationships, schema);
      const { routeName } = schema.get(originalNode);
      const properties = schema.getProperties(originalNode);
      const payload = util.parsePayload(form, properties);
      await api.patch(`${routeName}/${originalNode['@rid'].slice(1)}`, payload);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Deletes target node.
   */
  async handleDelete() {
    const { node } = this.state;
    const { schema } = this.props;
    const { routeName } = schema.get(node);
    await api.delete(`${routeName}/${node['@rid'].slice(1)}`);
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
    } = this.state;
    const { schema } = this.props;

    if (node) {
      return (
        <div className="edit-form-wrapper">
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
              Edit Ontology Term
            </Typography>
          </Paper>
          <OntologyFormComponent
            variant="edit"
            node={node}
            handleSubmit={this.handleSubmit}
            handleFinish={this.handleFinish}
            handleDelete={this.handleDelete}
            schema={schema}
          />
        </div>
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

const EditOntologyView = withKB(EditOntologyViewBase);

export {
  EditOntologyView,
  EditOntologyViewBase,
};
