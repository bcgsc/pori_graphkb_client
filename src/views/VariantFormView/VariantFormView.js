import React, { Component } from 'react';
import './VariantFormView.css';
import { Paper, Typography } from '@material-ui/core';
import VariantParserComponent from '../../components/VariantParserComponent/VariantParserComponent';

class VariantFormView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shorthandString: '',
      name: 'chr1:y.p11.1_p12del',
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    const { shorthandString, name } = this.state;
    return (
      <div className="variant-wrapper">
        <Paper elevation={4} className="paper variant-headline">
          <Typography variant="headline">{shorthandString}Variant Form</Typography>
        </Paper>

        <Paper elevation={4} className="paper variant-body">
          <VariantParserComponent
            handleChange={this.handleChange}
            name="name"
            value={name}
          />
        </Paper>
      </div>
    );
  }
}


export default VariantFormView;
