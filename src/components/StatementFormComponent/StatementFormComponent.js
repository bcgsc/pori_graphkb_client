/* eslint-disable */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './StatementFormComponent.css';
import {
  Button,
  Paper,
  Typography,
} from '@material-ui/core';
import FormTemplater from '../../components/FormTemplater/FormTemplater';
import api from '../../services/api';
import util from '../../services/util';
import RelationshipsForm from '../RelationshipsForm/RelationshipsForm';

class StatementFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      relationships: [],
      form: null,
      originalNode: null,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  async componentDidMount() {
    const { node, schema } = this.props;
    const { relationships } = this.state;

    const originalNode = node || {};

    const form = schema.initModel(originalNode, 'Statement');
    node.getEdges().forEach((edge) => {
      relationships.push(schema.initModel(edge, edge['@class']));
    });
    // Shallow copy the array to avoid mutating it.
    originalNode.relationships = relationships.slice(0);

    this.setState({
      form,
      relationships,
      originalNode,
    });
  }

  handleFinish() {

  }

  handleSubmit() {

  }

  handleChange(e) {
    const { form } = this.state;
    const { schema } = this.props;
    const { name, value } = e.target;
    form[name] = value;
    if (name.includes('.data') && value) {
      form[name.split('.')[0]] = schema.newRecord(value).getPreview();
    }
    this.setState({ form });
  }

  render() {
    const { form, relationships } = this.state;
    const { schema } = this.props;
    return form && (
      <div className="statement-form-wrapper">
        <div className="statement-form-node">
          <Paper className="statement-preview">
            <Typography>
              {form.sourceId && `${form.sourceId}:`}
            </Typography>
            <Typography variant="h5">
              {`${form.relevance} to ${form.appliesTo}`}
            </Typography>
            <Typography color="textSecondary">
              {form.source && `(${form.source})`}
            </Typography>
          </Paper>
          <Paper className="statement-form-params">
            <FormTemplater
              model={form}
              schema={schema}
              propSchemas={schema.getClass('Statement').properties}
              onChange={this.handleChange}
            />
          </Paper>
        </div>
        <Paper className="statement-form-relationships">
          <RelationshipsForm
            relationships={relationships}
            schema={schema}
            nodeRid={form['@rid']}
            onChange={this.handleChange}
            name="relationships"
            edgeTypes={['Implies', 'SupportedBy']}
          />
        </Paper>
      </div>
    );
  }
}


export default StatementFormComponent;
