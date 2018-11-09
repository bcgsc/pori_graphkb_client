import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Paper,
  Typography,
} from '@material-ui/core';
import { withSchema } from '../../components/SchemaContext/SchemaContext';
import api from '../../services/api';
import util from '../../services/util';
import StatementFormComponent from '../../components/StatementFormComponent/StatementFormComponent';

class AddStatementViewBase extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
  }

  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  async handleSubmit(form, relationships) {
    const { schema } = this.props;
    const { route, properties } = schema.getClass(form['@class']);
    const payload = util.parsePayload(form, properties);
    const relationshipPayloads = relationships.map((r) => {
      const { properties: rProperties } = schema.getClass(r['@class']);
      const rPayload = util.parsePayload(r, rProperties, ['@class']);
      Object.keys(rPayload).forEach((k) => {
        if (!rPayload[k] || rPayload[k] === '#node_rid') {
          delete rPayload[k];
          if (k === 'in' && rPayload.out) {
            rPayload.target = rPayload.out;
            delete rPayload.out;
          } else if (k === 'out' && rPayload.in) {
            rPayload.target = rPayload.in;
            delete rPayload.in;
          }
        }
      });
      return rPayload;
    });
    payload.supportedBy = relationshipPayloads.filter(r => r['@class'] === 'SupportedBy');
    payload.impliedBy = relationshipPayloads.filter(r => r['@class'] === 'Implies');
    await api.post(route, payload);
  }

  render() {
    const { schema } = this.props;
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
            Add Statement
          </Typography>
        </Paper>
        <StatementFormComponent
          schema={schema}
          onSubmit={this.handleSubmit}
          handleFinish={this.handleFinish}
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
AddStatementViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const AddStatementView = withSchema(AddStatementViewBase);

export {
  AddStatementView,
  AddStatementViewBase,
};
