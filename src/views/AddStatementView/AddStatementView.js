/**
 * @module /views/AddStatementView
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Paper,
  Typography,
} from '@material-ui/core';
import { withKB } from '../../components/KBContext';
import StatementFormComponent from '../../components/StatementFormComponent';
import api from '../../services/api';
import util from '../../services/util';

/**
 * Route for submitting Statement records to the db.
 */
class AddStatementViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is409: false,
    };
    this.controller = null;
  }

  componentWillUnmount() {
    if (this.controller !== null) {
      this.controller.abort();
    }
  }

  /**
   * Navigates to query page on successful form submission.
   */
  @boundMethod
  handleFinish() {
    const { history } = this.props;
    history.goBack();
  }

  /**
   * Bundles payload and sends post request to server.
   * @param {Object} form - Statement form data.
   * @param {Array.<Object>} relationships - Form staged relationships.
   * @return {boolean} true if submission is successful.
   */
  @boundMethod
  async handleSubmit(form, relationships) {
    const { schema } = this.props;
    const { routeName } = schema.get(form);
    const properties = schema.getProperties(form);

    const payload = util.parsePayload(form, properties);
    const relationshipPayloads = relationships.map((r) => {
      const relationshipProperties = schema.getProperties(r, ['@class']);
      const rPayload = util.parsePayload(r, relationshipProperties);

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
    payload.impliedBy = relationshipPayloads.filter(r => r['@class'] === 'ImpliedBy');
    try {
      this.controller = api.post(routeName, payload);
      await this.controller.request();
      return true;
    } catch (error) {
      console.error(error);
      this.setState({ is409: true });
      return false;
    }
  }

  render() {
    const { schema } = this.props;
    const { is409 } = this.state;
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
          onDelete={this.handleFinish}
          is409={is409}
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

const AddStatementView = withKB(AddStatementViewBase);

export {
  AddStatementView,
  AddStatementViewBase,
};
