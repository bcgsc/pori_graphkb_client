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
import { withKB } from '../../components/KBContext';
import StatementFormComponent from '../../components/StatementFormComponent';
import api from '../../services/api';
import util from '../../services/util';

/**
 * Route for editing existing Statement records.
 * @property {object} props
 * @property {Object} props.schema - Knowledgebase db schema.
 * @property {Object} props.history - App routing history object.
 * @property {Object} props.match
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
    const { routeName } = schema.get('Statement');
    const response = await api.get(`${routeName}/${rid}?neighbors=3`);
    const node = jc.retrocycle(response).result;
    this.setState({ node });
  }

  static get propTypes() {
    return {
      history: PropTypes.object.isRequired,
      schema: PropTypes.object.isRequired,
      match: PropTypes.object.isRequired,
    };
  }

  /**
   * Sends DELETE call to api for this node.
   */
  async handleDelete() {
    const { node } = this.state;
    const { schema } = this.props;
    const { routeName } = schema.get(node);
    const call = api.delete(`${routeName}/${node['@rid'].slice(1)}`);
    this.controllers.push(call);
    await call.request();
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
   * @return {boolean} true if submission is successful.
   */
  async handleSubmit(form, relationships, originalRelationships) {
    const { schema } = this.props;

    try {
      const patchEdgesCall = api.patchEdges(originalRelationships || [], relationships, schema);
      this.controllers.push(patchEdgesCall);
      await patchEdgesCall.request();

      const properties = schema.getProperties(form);
      const { routeName } = schema.get(form);
      const payload = util.parsePayload(form, properties);
      const patchNodeCall = api.patch(`${routeName}/${form['@rid'].slice(1)}`, payload);
      this.controllers.push(patchNodeCall);
      await patchNodeCall.request();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
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
          onFinish={this.handleFinish}
          onDelete={this.handleDelete}
        />
      </div>
    );
  }
}

const EditStatementView = withKB(EditStatementViewBase);

export {
  EditStatementView,
  EditStatementViewBase,
};
