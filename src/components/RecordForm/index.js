import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';
import EditIcon from '@material-ui/icons/Edit';

import api from '../../services/api';
import { SnackbarContext } from '../Snackbar';
import ActionButton from '../ActionButton';

import './index.scss';
import BaseNodeForm from './BaseRecordForm';
import { FORM_VARIANT } from './util';


/**
 * Form/View that displays the contents of a single node
 *
 * @property {string} props.variant the type of NodeForm to create
 * @property {string} props.rid the record id of the current record for the form
 * @property {string} props.title the title for this form
 */
class RecordForm extends React.Component {
  static contextType = SnackbarContext;

  static propTypes = {
    rid: PropTypes.string,
    title: PropTypes.string.isRequired,
    variant: PropTypes.string,
    onTopClick: PropTypes.func,
    modelName: PropTypes.string,
  };

  static defaultProps = {
    rid: null,
    variant: FORM_VARIANT.VIEW,
    onTopClick: null,
    modelName: null,
  };

  constructor(props) {
    super(props);
    const { modelName } = this.props;
    this.state = {
      content: modelName
        ? { '@class': modelName }
        : {},
    };
    this.controllers = [];
  }

  async componentDidMount() {
    await this.getNodeFromUri();
  }

  componentWillUnmount() {
    this.controllers.map(c => c.abort());
    this.controllers = [];
  }

  async getNodeFromUri() {
    // parse the node ident from the uri
    const { rid, variant } = this.props;

    if (variant !== FORM_VARIANT.NEW) {
      // If not a new form then should have existing content
      try {
        const call = api.get(`/v/${rid}?neighbors=3`);
        this.controllers.push(call);
        const content = await call.request();
        this.setState({ content });
      } catch (err) {
        console.error(err);
      }
    }
  }

  @boundMethod
  async handleNewAction({ content, errors }) {
    const snackbar = this.context;

    if (errors && Object.keys(errors).length) {
      // bring up the snackbar for errors
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
    } else {
      // ok to POST
      snackbar.add('Created a new record');
    }
  }

  @boundMethod
  async handleDeleteAction({ content, errors }) {
    const snackbar = this.context;
    snackbar.add('You deleted a thing');
  }

  @boundMethod
  async handleEditAction({ content, errors }) {
    const snackbar = this.context;
    if (errors && Object.keys(errors).length) {
      // bring up the snackbar for errors
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
    } else {
      // ok to POST
      snackbar.add('You edited a thing');
    }
  }

  render() {
    const {
      title, variant, onTopClick, modelName, ...rest
    } = this.props;
    const { content } = this.state;

    const actions = {
      [FORM_VARIANT.EDIT]: this.handleEditAction,
      [FORM_VARIANT.NEW]: this.handleNewAction,
    };

    return (
      <Paper className="node-form__wrapper" elevation={4}>
        <div className="node-form__header">
          <Typography variant="h5" component="h1">{title}</Typography>
          {variant === FORM_VARIANT.VIEW && onTopClick && (
            <Button
              onClick={onTopClick}
              variant="outlined"
            >
              Edit
              <EditIcon />
            </Button>
          )}
          {variant === FORM_VARIANT.EDIT && onTopClick && (
            <ActionButton
              onClick={onTopClick}
              variant="outlined"
              message="Are you sure you want to leave this page?"
            >
              View
            </ActionButton>
          )}
        </div>
        <BaseNodeForm
          value={content}
          modelName={modelName}
          onSubmit={actions[variant] || null}
          onDelete={this.handleDeleteAction}
          variant={variant}
          collapseExtra
          name="name"
          {...rest}
        />
      </Paper>
    );
  }
}

export default RecordForm;
