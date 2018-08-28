/**
 * @module /views/EditOntologyView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as jc from 'json-cycle';
import OntologyFormComponent from '../../components/OntologyFormComponent/OntologyFormComponent';
import api from '../../services/api';

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

    this.handleNodeFinish = this.handleNodeFinish.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  componentDidMount() {
    const { match } = this.props;
    const { rid } = match.params;
    api.get(`/ontologies/${rid}?neighbors=3`).then((data) => {
      const node = jc.retrocycle(data).result;
      this.setState({ node });
    });
  }

  /**
   * Sets completed flag to navigate back to previous query.
   */
  handleNodeFinish() {
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
          handleNodeFinish={this.handleNodeFinish}
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
