import React, { Component } from 'react';
import './VariantFormView.css';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import VariantParserComponent from '../../components/VariantParserComponent/VariantParserComponent';

class VariantFormView extends Component {
  constructor(props) {
    super(props);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
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

  render() {
    return (
      <div className="view-wrapper">
        <Paper elevation={4} className="paper variant-headline">
          <Typography variant="headline">Variant Form</Typography>
          <div className="variant-cancel-btn">
            <Button
              color="default"
              onClick={this.handleCancel}
              variant="outlined"
            >
              Cancel
            </Button>
          </div>
        </Paper>

        <div className="variant-body">
          <VariantParserComponent
            handleFinish={this.handleFinish}
          />
        </div>
      </div>
    );
  }
}

/**
 * @namespace
 * @param {Object} history - Application routing history object.
 */
VariantFormView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default VariantFormView;
