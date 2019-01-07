/**
 * @module /views/AddOntologyView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './AddOntologyView.scss';
import {
  Paper,
  Button,
  Typography,
} from '@material-ui/core';
import { withKB } from '../../components/KBContext';
import OntologyFormComponent from '../../components/OntologyFormComponent';
import api from '../../services/api';
import util from '../../services/util';

/**
 * View for editing or adding database nodes. Includes a NodeFormComponent with the
 * 'add' variant. Submissions will post to the server, and redirect user to the home
 * query page.
 */
class AddOntologyViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is409: false,
    };
    this.controllers = [];
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  /**
   * Posts new node to the api, then posts all new edges.
   * @param {Object} form - Statement form data.
   * @param {Array.<Object>} relationships - Form staged relationships.
   * @return {boolean} true if submission is successful.
   */
  async handleSubmit(form, relationships) {
    const { schema } = this.props;

    const properties = schema.getProperties(form);
    const { routeName } = schema.get(form);
    const payload = util.parsePayload(form, properties);
    try {
      const call = api.post(routeName, { ...payload });
      this.controllers.push(call);
      const response = await call.request();
      // create requests for each relationship being added
      const edgeCalls = api.submitEdges(relationships, schema, response.result['@rid']);
      this.controllers.push(...edgeCalls);
      await Promise.all(edgeCalls.map(async e => e.request()));
      return true;
    } catch (error) {
      this.setState({ is409: true });
      return false;
    }
  }

  /**
   * Navigates user back to query page.
   */
  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  render() {
    const { schema } = this.props;
    const { is409 } = this.state;

    return (
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
          handleSubmit={this.handleSubmit}
          handleFinish={this.handleFinish}
          is409={is409}
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

const AddOntologyView = withKB(AddOntologyViewBase);

/**
 * Export consumer component and regular component for testing.
 */
export {
  AddOntologyView,
  AddOntologyViewBase,
};


export default AddOntologyViewBase;
