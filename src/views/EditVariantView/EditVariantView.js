import React, { Component } from 'react';
import './EditVariantView.css';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import * as jc from 'json-cycle';
import VariantParserComponent from '../../components/VariantParserComponent/VariantParserComponent';
import { withSchema } from '../../components/SchemaContext/SchemaContext';
import util from '../../services/util';
import api from '../../services/api';

class EditVariantViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      variant: null,
    };
    this.handleCancel = this.handleCancel.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
  }

  async componentDidMount() {
    const { match, schema } = this.props;
    const { rid } = match.params;
    const { route } = schema.get('PositionalVariant');
    const response = await api.get(`${route}/${rid}?neighbors=3`);
    const variant = schema.newRecord(jc.retrocycle(response).result);
    this.setState({
      variant,
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
    await api.patch(`/positionalvariants/${variant['@rid'].slice(1)}`, payload);
  }

  render() {
    const { schema } = this.props;
    const { variant } = this.state;
    if (!variant) return null;
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
          <VariantParserComponent
            handleFinish={this.handleFinish}
            handleSubmit={this.submitVariant}
            schema={schema}
            initVariant={variant}
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
EditVariantViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const EditVariantView = withSchema(EditVariantViewBase);

export {
  EditVariantViewBase,
  EditVariantView,
};
