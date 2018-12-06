/**
 * @module /views/AddVariantView
 */
import React, { Component } from 'react';
import './AddVariantView.css';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import PositionalVariantParser from '../../components/PositionalVariantParser/PositionalVariantParser';
import util from '../../services/util';
import api from '../../services/api';
import { withKB } from '../../components/KBContext/KBContext';

/**
 * Route for submitting Variant records to db.
 */
class AddVariantViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is409: false,
    };
    this.handleCancel = this.handleCancel.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
  }

  /**
   * Takes action on a variant form cancel. Navigates to previously visited page.
   */
  handleCancel() {
    const { history } = this.props;
    history.back();
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
  async submitVariant(variant, relationships) {
    const { schema } = this.props;
    const copy = Object.assign({}, variant);
    const properties = schema.getProperties(variant['@class']);
    const route = schema.getRoute(variant['@class']);
    // Strips away empty break objects and casts number props to numbers.
    Object.keys(copy).forEach((k) => {
      if (typeof copy[k] === 'object' && copy[k]) { // more flexible
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
    try {
      const response = await api.post(route, payload);

      await api.submitEdges(relationships, schema, response.result['@rid']);
      return true;
    } catch (error) {
      this.setState({ is409: true });
      return false;
    }
  }

  render() {
    const { schema } = this.props;
    const { is409 } = this.state;
    if (!schema) return null;
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
          <Typography variant="h5">Add New Variant</Typography>
        </Paper>

        <div className="variant-body">
          <PositionalVariantParser
            handleFinish={this.handleFinish}
            handleSubmit={this.submitVariant}
            schema={schema}
            is409={is409}
          />
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
AddVariantViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const AddVariantView = withKB(AddVariantViewBase);

export {
  AddVariantViewBase,
  AddVariantView,
};
