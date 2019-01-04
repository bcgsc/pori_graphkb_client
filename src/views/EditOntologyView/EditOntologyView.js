/**
 * @module /views/EditOntologyView
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './EditOntologyView.scss';
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
 *
 * @property {Object} props.match - Match object for extracting URL parameters.
 * @property {Object} props.history - Application routing history object.
 * @property {Object} props.schema - Knowledgebase schema object.
 */
class EditOntologyViewBase extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    schema: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      node: null,
    };
    this.controllers = [];
  }

  /**
   * Initializes editing node and query on return.
   */
  async componentDidMount() {
    const { match } = this.props;
    const { rid } = match.params;
    const call = api.get(`/ontologies/${rid}?neighbors=${DEFAULT_NEIGHBORS}`);
    this.controllers.push(call);
    const response = await call.request();
    const node = jc.retrocycle(response).result;
    this.setState({
      node,
    });
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  /**
   * Adds new edges and deletes specified ones, then PATCHes property changes
   * to the api.
   * @param {Object} form - completed form object.
   * @param {Array.<Object>} relationships - List of relationship data.
   * @param {Object} originalNode - Original node data.
   * @return {boolean} true if submission is successful.
   */
  @boundMethod
  async handleSubmit(form, relationships, originalNode) {
    const { schema } = this.props;

    try {
      // Edit the edges
      const call = api.patchEdges(originalNode.relationships || [], relationships, schema);
      this.controllers.push(call);
      await call.request();
      const { routeName } = schema.get(originalNode);
      const properties = schema.getProperties(originalNode);
      const payload = util.parsePayload(form, properties);
      // Edit the contents of the node itself
      const patchNodeCall = api.patch(`${routeName}/${originalNode['@rid'].slice(1)}`, payload);
      this.controllers.push(patchNodeCall);
      await patchNodeCall.request();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Deletes target node.
   */
  @boundMethod
  async handleDelete() {
    const { node } = this.state;
    const { schema } = this.props;
    const { routeName } = schema.get(node);
    const call = api.delete(`${routeName}/${node['@rid'].slice(1)}`);
    this.controllers.push(call);
    await call.request();
  }

  /**
   * Navigates back to previous view.
   */
  @boundMethod
  handleCancel() {
    const { history } = this.props;
    history.back();
  }

  /**
   * Navigates back to query page.
   */
  @boundMethod
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

const EditOntologyView = withKB(EditOntologyViewBase);

export {
  EditOntologyView,
  EditOntologyViewBase,
};
