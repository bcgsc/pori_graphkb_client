/**
 * @module /views/EditOntologyView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as jc from 'json-cycle';
import OntologyFormComponent from '../../components/OntologyFormComponent/OntologyFormComponent';
import api from '../../services/api';
import config from '../../config.json';

const { DEFAULT_NEIGHBORS } = config;

/**
 * View for record editing. Contains a form component with the 'edit' variant
 * selected. Selects node with record ID as passed in to the url (/edit/[rid]).
 * Redirects to the home query page on form submit, or to the error page.
 */
class EditOntologyView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
    };

    this.handleFinish = this.handleFinish.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  async componentDidMount() {
    const { match } = this.props;
    const { rid } = match.params;
    const response = await api.get(`/ontologies/${rid}?neighbors=${DEFAULT_NEIGHBORS}`);
    const node = jc.retrocycle(response).result;
    this.setState({ node });
  }

  /**
   * Sets completed flag to navigate back to previous query.
   */
  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  render() {
    const {
      node,
    } = this.state;


    if (node) {
      return (
        <OntologyFormComponent
          variant="edit"
          node={node}
          handleFinish={this.handleFinish}
        />
      );
    }
    return null;
  }
}

EditOntologyView.propTypes = {
  /**
   * @param {Object} match - Match object for extracting URL parameters.
   */
  match: PropTypes.object.isRequired,
  /**
   * @param {Object} history - Application routing history object.
   */
  history: PropTypes.object.isRequired,
};

export default EditOntologyView;
