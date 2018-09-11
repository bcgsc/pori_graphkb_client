import React, { Component } from 'react';
import './VariantFormView.css';
import PropTypes from 'prop-types';
import { Paper, Typography } from '@material-ui/core';
import VariantParserComponent from '../../components/VariantParserComponent/VariantParserComponent';

class VariantFormView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shorthandString: '',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleFinish = this.handleFinish.bind(this);
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
