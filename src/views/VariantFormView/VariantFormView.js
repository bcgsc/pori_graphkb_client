import React, { Component } from 'react';
import './VariantFormView.css';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import VariantParserComponent from '../../components/VariantParserComponent/VariantParserComponent';

class VariantFormView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shorthandString: '',
    };
    this.handleCancel = this.handleCancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
  }

  handleCancel() {
    const { history } = this.props;
    history.back();
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleFinish() {
    const { history } = this.props;
    history.push('/query');
  }

  render() {
    const { shorthandString } = this.state;
    return (
      <div className="variant-wrapper">
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
            handleChange={this.handleChange}
            name="shorthandString"
            value={shorthandString}
            handleFinish={this.handleFinish}
          />
        </div>
      </div>
    );
  }
}

VariantFormView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default VariantFormView;
