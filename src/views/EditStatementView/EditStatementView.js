/* eslint-disable */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Paper,
  Typography,
} from '@material-ui/core';
import * as jc from 'json-cycle';
import { withSchema } from '../../components/SchemaContext/SchemaContext';
import FormTemplater from '../../components/FormTemplater/FormTemplater';
import api from '../../services/api';
import StatementFormComponent from '../../components/StatementFormComponent/StatementFormComponent';

class EditStatementViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
    };
  }

  async componentDidMount() {
    const { match, schema } = this.props;
    const { rid } = match.params;
    const { route, properties } = schema.get('Statement');
    const response = await api.get(`${route}/${rid}?neighbors=3`);
    const node = jc.retrocycle(response).result;
    console.log(schema.newRecord(node));
    console.log(properties);
    this.setState({ node: schema.newRecord(node) })
  }

  handleFinish() {

  }

  handleSubmit() {

  }

  render() {
    const { node } = this.state;
    const { schema } = this.props;
    return node && (
      <div className="edit-form-wrapper">
        <Paper className="form-header" elevation={4}>
          <div className="form-cancel-btn">
            <Button
              color="default"
              onClick={this.handleFinish}
              variant="outlined"
            >
              Cancel
              </Button>
          </div>
          <Typography variant="h5" className="form-title">
            Edit Statement
          </Typography>
        </Paper>
        <StatementFormComponent
          schema={schema}
          node={node}
        />
      </div>
    );
  }
}

const EditStatementView = withSchema(EditStatementViewBase);

export {
  EditStatementView,
  EditStatementViewBase,
};