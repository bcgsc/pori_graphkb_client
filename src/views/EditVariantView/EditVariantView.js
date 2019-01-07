/**
 * @module /views/EditVariantView
 */
import React, { Component } from 'react';
import '../AddVariantView/AddVariantView.scss';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import * as jc from 'json-cycle';
import { withKB } from '../../components/KBContext';
import OntologyFormComponent from '../../components/OntologyFormComponent';
import PositionalVariantParser from '../../components/PositionalVariantParser';
import util from '../../services/util';
import api from '../../services/api';

/**
 * Route for editing existing Variant records.
 */
class EditVariantViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
    };
    this.controllers = [];
    this.handleCancel = this.handleCancel.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
  }

  /**
   * Grabs target record and initializes state.
   */
  async componentDidMount() {
    const { match, schema } = this.props;
    const { rid } = match.params;
    const { routeName } = schema.get('Variant');
    const call = api.get(`${routeName}/${rid}?neighbors=3`);
    this.controllers.push(call);
    const response = await call.request();
    const node = jc.retrocycle(response).result;
    this.setState({
      node,
    });
  }

  /**
   * Takes action on a variant form cancel. Navigates to previously visited page.
   */
  handleCancel() {
    const { history } = this.props;
    history.back();
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
   * Takes action on a successful variant submission. Navigates to query page.
   */
  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  /**
   * Submits a POST request to the server with current variant data.
   * @param {Object} form - Form object containing core record parameters.
   * @param {Array.<Object>} relationships - New list of relationships.
   * @param {Array.<Object>} originalRelationships - Original list of relationships.
   * @return {boolean} true if submission is successful.
   */
  async submitVariant(form, relationships, originalRelationships) {
    const { schema } = this.props;
    const { node } = this.state;
    let oRelationships = originalRelationships;
    if (!Array.isArray(originalRelationships)) {
      oRelationships = originalRelationships.relationships.slice();
    }
    try {
      const edgesCall = api.patchEdges(oRelationships || [], relationships, schema);
      this.controllers.push(...edgesCall);
      await Promise.all(edgesCall.map(async c => c.request()));

      const copy = Object.assign({}, form);
      const properties = schema.getProperties(form);
      const { routeName } = schema.get(form);
      Object.keys(copy).forEach((k) => {
        if (copy[k] && typeof copy[k] === 'object') {
          if (!copy[k]['@class']) {
            delete copy[k];
          } else {
            const nestedProps = schema.getProperties(copy[k]);
            nestedProps.forEach((prop) => {
              if (!copy[k][prop.name]) {
                if (prop.type === 'integer' && prop.mandatory) {
                  copy[k][prop.name] = Number(copy[k][prop.name]);
                } else {
                  delete copy[k][prop.name];
                }
              }
            });
          }
        }
      });
      const payload = util.parsePayload(copy, properties);
      const call = api.patch(`${routeName}/${node['@rid'].slice(1)}`, payload);
      this.controllers.push(call);
      await call.request();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  render() {
    const { schema } = this.props;
    const { node } = this.state;
    if (!node) return null;
    return (
      <div className="variant-wrapper">
        <Paper elevation={4} className="variant-headline">
          <div className="variant-cancel-btn">
            <Button
              color="default"
              onClick={this.handleCancel}
              variant="outlined"
            >
              Cancel
            </Button>
          </div>
          <Typography variant="h5">Edit Variant Form</Typography>
        </Paper>

        <div className="variant-body">
          {node['@class'] === 'PositionalVariant'
            ? (
              <PositionalVariantParser
                handleFinish={this.handleFinish}
                handleSubmit={this.submitVariant}
                handleDelete={this.handleDelete}
                schema={schema}
                initVariant={node}
              />)
            : (
              <OntologyFormComponent
                variant="edit"
                node={node}
                handleSubmit={this.submitVariant}
                handleFinish={this.handleFinish}
                handleDelete={this.handleDelete}
                schema={schema}
              />
            )}
        </div>
      </div>
    );
  }
}

/**
 * @namespace
 * @property {Object} history - Application routing history object.
 * @property {Object} schema - Knowledgebase schema object.
 */
EditVariantViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const EditVariantView = withKB(EditVariantViewBase);

export {
  EditVariantViewBase,
  EditVariantView,
};
