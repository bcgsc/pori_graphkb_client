import React, { Component } from 'react';
import './AddVariantView.css';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import VariantParserComponent from '../../components/VariantParserComponent/VariantParserComponent';
import util from '../../services/util';
import api from '../../services/api';
import { withSchema } from '../../components/SchemaContext/SchemaContext';

class AddVariantViewBase extends Component {
  constructor(props) {
    super(props);
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
  async submitVariant(variant) {
    const { schema } = this.props;
    const copy = Object.assign({}, variant);
    const classSchema = schema.getClass('PositionalVariant').properties;
    Object.keys(copy).forEach((k) => {
      if (typeof copy[k] === 'object') { // more flexible
        if (!copy[k]['@class']) {
          delete copy[k];
        } else {
          const nestedProps = schema.getClass(copy[k]['@class']).properties;
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
    const payload = util.parsePayload(copy, classSchema);
    await api.post('/positionalvariants', payload);
  }

  render() {
    const { schema } = this.props;
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
          <Typography variant="h5">Variant Form</Typography>
        </Paper>

        <div className="variant-body">
          <VariantParserComponent
            handleFinish={this.handleFinish}
            handleSubmit={this.submitVariant}
            schema={schema}
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

const AddVariantView = withSchema(AddVariantViewBase);

export {
  AddVariantViewBase,
  AddVariantView,
};
