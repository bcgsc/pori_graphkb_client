import React, { Component } from 'react';
import './VariantFormView.css';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import VariantParserComponent from '../../components/VariantParserComponent/VariantParserComponent';
import util from '../../services/util';
import api from '../../services/api';

class VariantFormView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      schema: null,
    };
    this.handleCancel = this.handleCancel.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
  }

  async componentDidMount() {
    const schema = await api.getSchema();
    this.setState({ schema });
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
    const { schema } = this.state;
    const copy = Object.assign({}, variant);
    const classSchema = util.getClass('PositionalVariant', schema).properties;
    Object.keys(copy).forEach((k) => {
      if (typeof copy[k] === 'object') { // more flexible
        if (!copy[k]['@class']) {
          delete copy[k];
        } else {
          const nestedProps = util.getClass(copy[k]['@class'], schema).properties;
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
    const { schema } = this.state;
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
          <Typography variant="headline">Variant Form</Typography>
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
 */
VariantFormView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default VariantFormView;
