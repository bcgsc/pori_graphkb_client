/**
 * @module /views/OntologyDetailView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import * as jc from 'json-cycle';
import OntologyDetailComponent from '../../components/OntologyDetailComponent/OntologyDetailComponent';
import api from '../../services/api';
import Ontology from '../../services/ontology';
import config from '../../config.json';

const { DEFAULT_NEIGHBORS } = config;

/**
 * Fullscreen view for record details. Selects record with identifier passed in through
 * the route URL.
 */
class OntologyDetailView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
      completedFlag: false,
      returnFlag: false,
      query: '',
      error: null,
      loginRedirect: false,
    };

    this.handleNodeDelete = this.handleNodeDelete.bind(this);
    this.handleNodeEdit = this.handleNodeEdit.bind(this);
    this.handleNewQuery = this.handleNewQuery.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  async componentDidMount() {
    const { match } = this.props;
    try {
      const response = await api.get(`/ontologies/${match.params.rid}?neighbors=${DEFAULT_NEIGHBORS}`);
      const node = new Ontology(jc.retrocycle(response).result);
      this.setState({ node });
    } catch (error) {
      if (error.status === 401) {
        this.setState({ loginRedirect: true });
      } else {
        this.setState({ error });
      }
    }
  }

  /**
   * Sets return flag to navigate to query page.
   */
  handleNodeDelete() {
    this.setState({ returnFlag: true });
  }

  /**
  handleNodeEditag to navigate back to previous query.
   */
  handleNodeEdit() {
    const { history } = this.props;
    history.goBack();
  }

  /**
   * Navigates to the table with the query string.
   * @param {string} search - search string.
   */
  handleNewQuery(search) {
    const { history } = this.props;
    history.push(`/data/table?${search}`);
  }

  render() {
    const {
      node,
      completedFlag,
      returnFlag,
      query,
      error,
      loginRedirect,
    } = this.state;

    if (error) {
      return <Redirect push to={{ pathname: '/error', state: error }} />;
    }
    if (loginRedirect) {
      return <Redirect push to="/login" />;
    }
    if (returnFlag) {
      return <Redirect push to="/query" />;
    }
    if (completedFlag) {
      return <Redirect push to={{ pathname: '/data/table', search: query }} />;
    }

    // TODO: add children buttons props.
    if (node) {
      return (
        <OntologyDetailComponent
          node={node}
          handleNodeEditStart={this.handleNodeEdit}
          handleNewQuery={this.handleNewQuery}
        />
      );
    }
    return null;
  }
}

/**
 * @namespace
 * @param {Object} match - Match object for extracting URL parameters.
 * @param {Object} history - Application routing history object.
 */
OntologyDetailView.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default OntologyDetailView;
