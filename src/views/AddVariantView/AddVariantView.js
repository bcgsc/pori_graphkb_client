/**
 * @module /views/AddVariantView
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';

import './AddVariantView.scss';
import { withKB } from '../../components/KBContext';
import PositionalVariantParser from '../../components/PositionalVariantParser';
import util from '../../services/util';
import api from '../../services/api';

/**
 * Route for submitting Variant records to db.
 *
 * @property {object} props
 * @property {Object} props.history - Application routing history object.
 * @property {Object} props.schema - Knowledgebase schema object.
 */
class AddVariantViewBase extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    schema: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      is409: false,
    };
    this.controllers = [];
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  /**
   * Takes action on a successful variant submission. Navigates to query page.
   */
  @boundMethod
  handleFinish() {
    const { history } = this.props;
    history.goBack();
  }

  /**
   * Submits a POST request to the server with current variant data.
   * @param {Object} form - completed form object.
   * @param {Array.<Object>} relationships - List of relationship data.
   * @return {boolean} true if submission is successful.
   */
  @boundMethod
  async submitVariant(form, relationships) {
    const { schema } = this.props;
    const copy = Object.assign({}, form);
    const properties = schema.getProperties(form);
    const { routeName } = schema.get(form);
    // Strips away empty break objects and casts number props to numbers.
    Object.keys(copy).forEach((k) => {
      if (typeof copy[k] === 'object' && copy[k]) { // more flexible
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
    try {
      const call = api.post(routeName, payload);
      this.controllers.push(call);
      const response = await call.request();

      const edgesCalls = api.submitEdges(relationships, schema, response.result['@rid']);
      this.controllers.push(...edgesCalls);
      await Promise.all(edgesCalls.map(async c => c.request()));
      return true;
    } catch (error) {
      this.setState({ is409: true });
      console.error(error);
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
              onClick={this.handleFinish}
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

const AddVariantView = withKB(AddVariantViewBase);

export {
  AddVariantViewBase,
  AddVariantView,
};
