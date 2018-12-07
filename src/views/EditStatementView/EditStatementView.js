/**
 * @module /views/EditStatementView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Paper,
  Typography,
} from '@material-ui/core';
import * as jc from 'json-cycle';
import { withKB } from '../../components/KBContext/KBContext';
import api from '../../services/api';
import util from '../../services/util';
import StatementFormComponent from '../../components/StatementFormComponent/StatementFormComponent';

/**
 * Route for editing existing Statement records.
 */
class EditStatementViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Makes call to api to retrieve statement with RID specified in url.
   */
  async componentDidMount() {
    const { match, schema } = this.props;
    const { rid } = match.params;
    const route = schema.getRoute('Statement');
    const response = await api.get(`${route}/${rid}?neighbors=3`);
    const node = jc.retrocycle(response).result;
    this.setState({ node });
  }

  /**
   * Sends DELETE call to api for this node.
   */
  async handleDelete() {
    const { node } = this.state;
    const { schema } = this.props;
    const route = schema.getRoute(node['@class']);
    await api.delete(`${route}/${node['@rid'].slice(1)}`);
  }

  /**
   * Navigates away from page.
   */
  handleFinish() {
    const { history } = this.props;
    history.back();
  }

  /**
   * PATCHes the updated node to the server and posts/deletes the difference in
   * relationship arrays.
   * @param {Object} form - Form object containing core record parameters.
   * @param {Array.<Object>} relationships - New list of relationships.
   * @param {Array.<Object>} originalRelationships - Original list of relationships.
   */
  async handleSubmit(form, relationships, originalRelationships) {
    const { schema } = this.props;
    await api.patchEdges(originalRelationships || [], relationships, schema);
    const properties = schema.getProperties(form['@class']);
    const route = schema.getRoute(form['@class']);
    const payload = util.parsePayload(form, properties);
    await api.patch(`${route}/${form['@rid'].slice(1)}`, payload);
    return true;
  }

  render() {
    const { node } = this.state;
    const { schema } = this.props;
    return node && (
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
            Edit Statement
          </Typography>
        </Paper>
        <StatementFormComponent
          schema={schema}
          node={node}
          onSubmit={this.handleSubmit}
          handleFinish={this.handleFinish}
          onDelete={this.handleDelete}
        />
      </div>
    );
  }
}

/**
 * @namespace
 * @property {Object} history - App routing history object.
 * @property {Object} schema - Knowledgebase db schema.
 */
EditStatementViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const EditStatementView = withKB(EditStatementViewBase);

export {
  EditStatementView,
  EditStatementViewBase,
};
