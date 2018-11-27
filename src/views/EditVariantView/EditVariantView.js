/**
 * @module /views/EditVariantView
 */
import React, { Component } from 'react';
import './EditVariantView.css';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import * as jc from 'json-cycle';
import PositionalVariantParser from '../../components/PositionalVariantParser/PositionalVariantParser';
import { withKB } from '../../components/KBContext/KBContext';
import OntologyFormComponent from '../../components/OntologyFormComponent/OntologyFormComponent';
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
    const route = schema.getRoute('Variant');
    const response = await api.get(`${route}/${rid}?neighbors=3`);
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
    const route = schema.getRoute(node['@class']);
    await api.delete(`${route}/${node['@rid'].slice(1)}`);
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
   */
  async submitVariant(variant, relationships, originalRelationships) {
    const { schema } = this.props;
    let oRelationships = originalRelationships;
    if (!Array.isArray(originalRelationships)) {
      oRelationships = originalRelationships.relationships.slice();
    }
    await api.patchEdges(oRelationships || [], relationships, schema);

    const copy = Object.assign({}, variant);
    const properties = schema.getProperties(variant['@class']);
    const route = schema.getRoute(variant['@class']);
    Object.keys(copy).forEach((k) => {
      if (copy[k] && typeof copy[k] === 'object') {
        if (!copy[k]['@class']) {
          delete copy[k];
        } else {
          const nestedProps = schema.getProperties(copy[k]['@class']);
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
    await api.patch(`${route}/${variant['@rid'].slice(1)}`, payload);
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
