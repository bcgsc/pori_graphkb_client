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
    this.handleFinish = this.handleFinish.bind(this);
  }

  /**
   * Triggered when the user hits the submit button.
   */
  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  render() {
    return (
      <OntologyFormComponent
        variant="add"
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
