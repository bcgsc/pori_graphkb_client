import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper, Typography, Button,
} from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';
import LocalLibraryIcon from '@material-ui/icons/LocalLibrary';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';

import api from '../../services/api';
import './index.scss';
import BaseNodeForm from './BaseRecordForm';
import { FORM_VARIANT } from './util';
import { withKB } from '../KBContext';
import ReviewDialog from './ReviewDialog';
import ToggleButtonGroup from '../ToggleButtonGroup';


const cleanPayload = (payload) => {
  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }
  const newPayload = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          newPayload[key] = value.map((arr) => {
            if (arr && arr['@rid']) {
              return arr['@rid'];
            }
            return cleanPayload(arr);
          });
        } else if (value['@rid']) {
          newPayload[key] = value['@rid'];
        } else {
          newPayload[key] = value;
        }
      } else {
        newPayload[key] = value;
      }
    }
  });
  return newPayload;
};


/**
 * Form/View that displays the contents of a single node
 *
 * @property {string} props.variant the type of NodeForm to create
 * @property {string} props.rid the record id of the current record for the form
 * @property {string} props.title the title for this form
 * @property {string} props.modelName name of class model to be displayed
 * @property {object} props.schema schema object defining class/prop models
 * @property {value} props.value values of individual properties of passed class model
 */
class RecordForm extends React.PureComponent {
  static contextType = SnackbarContext;

  static propTypes = {
    modelName: PropTypes.string,
    onError: PropTypes.func,
    onSubmit: PropTypes.func,
    onTopClick: PropTypes.func,
    rid: PropTypes.string,
    schema: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    variant: PropTypes.string,
    value: PropTypes.object,
  };

  static defaultProps = {
    modelName: null,
    onError: () => {},
    onSubmit: () => {},
    onTopClick: null,
    rid: null,
    variant: FORM_VARIANT.VIEW,
    value: {},
  };

  constructor(props) {
    super(props);
    const { value = {}, modelName } = this.props;

    const defaultContent = { ...value };
    if (modelName && !defaultContent['@class']) {
      defaultContent['@class'] = modelName;
    }

    this.state = {
      actionInProgress: false,
      reviewDialogOpen: false,
      newReview: {},
      ...defaultContent,
    };
    this.controllers = [];
  }

  async componentDidMount() {
    await this.getNodeFromUri();
  }

  async componentDidUpdate(prevProps) {
    const {
      rid,
      variant,
      modelName,
      value: { '@class': defaultModel },
    } = this.props;
    if (
      rid !== prevProps.rid
      || variant !== prevProps.variant
      || modelName !== prevProps.modelName
      || defaultModel !== prevProps.value['@class']
    ) {
      await this.getNodeFromUri();
    }
  }

  componentWillUnmount() {
    this.controllers.map(c => c.abort());
    this.controllers = [];
  }

  /**
   * Issues a GET request to the API to retrieve the record contents
   */
  async getNodeFromUri() {
    // parse the node ident from the uri
    const {
      rid,
      variant,
      onError,
      schema,
      modelName,
      value,
    } = this.props;

    const { '@class': defaultModel } = value;

    const model = schema.get(modelName || defaultModel || modelName || 'V');

    if (variant !== FORM_VARIANT.NEW && variant !== FORM_VARIANT.SEARCH) {
      // If not a new form then should have existing content
      this.setState({ actionInProgress: true });
      try {
        const call = api.get(`${model.routeName}/${rid.replace(/^#/, '')}?neighbors=3`, { forceListReturn: true });
        this.controllers.push(call);
        const result = await call.request();
        if (result && result.length) {
          this.setState({ ...result[0] });
        } else {
          onError({ error: { name: 'RecordNotFound', message: `Unable to retrieve record details for ${rid}` } });
        }
      } catch (err) {
        onError({ error: err });
      }
      this.setState({ actionInProgress: false });
    }
  }

  /**
   * Handler for submission of a new record
   */
  @boundMethod
  async handleNewAction({ content, errors }) {
    const snackbar = this.context;
    const {
      schema, onSubmit, onError, modelName,
    } = this.props;

    if (errors && Object.keys(errors).length) {
      // bring up the snackbar for errors
      console.error(errors);
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
    } else {
      // ok to POST
      if (!content || !content['@class']) {
        content['@class'] = modelName;
      }
      const payload = cleanPayload(content);
      const { routeName } = schema.get(payload);
      const call = api.post(routeName, payload);
      this.controllers.push(call);
      this.setState({ actionInProgress: true });
      try {
        const result = await call.request();
        snackbar.add(`Sucessfully created the record ${result['@rid']}`);
        onSubmit(result);
      } catch (err) {
        console.error(err);
        snackbar.add(`Error (${err.name}) in creating the record`);
        onError({ error: err, content });
      }
      this.setState({ actionInProgress: false });
    }
  }

  /**
   * Handler for deleting an existing record
   */
  @boundMethod
  async handleDeleteAction({ content }) {
    const snackbar = this.context;
    const { schema, onSubmit, onError } = this.props;

    const { routeName } = schema.get(content);
    const call = api.delete(`${routeName}/${content['@rid'].replace(/^#/, '')}`);
    this.controllers.push(call);
    this.setState({ actionInProgress: true });
    try {
      await call.request();
      snackbar.add(`Sucessfully deleted the record ${content['@rid']}`);
      onSubmit();
    } catch (err) {
      snackbar.add(`Error (${err.name}) in deleting the record (${content['@rid']})`);
      onError({ error: err, content });
    }
    this.setState({ actionInProgress: false });
  }

  /**
   * Handler for edits to an existing record
   */
  @boundMethod
  async handleEditAction({ content: { impliedBy, supportedBy, ...content }, errors }) {
    const snackbar = this.context;
    const { schema, onSubmit, onError } = this.props;

    if (errors && Object.keys(errors).length) {
      // bring up the snackbar for errors
      console.error(errors);
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
    } else {
      // ok to PATCH
      const payload = cleanPayload(content);
      const { routeName } = schema.get(payload);
      const call = api.patch(`${routeName}/${content['@rid'].replace(/^#/, '')}`, payload);
      this.controllers.push(call);
      this.setState({ actionInProgress: true });
      try {
        const result = await call.request();
        snackbar.add(`Sucessfully edited the record ${result['@rid']}`);
        onSubmit(result);
      } catch (err) {
        snackbar.add(`Error (${err.name}) in editing the record (${content['@rid']})`);
        onError({ error: err, content });
      }
      this.setState({ actionInProgress: false });
    }
  }

  @boundMethod
  async handleSearchAction({ content, errors }) {
    const snackbar = this.context;
    const { onSubmit } = this.props;

    if (errors && Object.keys(errors).length) {
      console.error(errors);
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
    } else {
      onSubmit(content);
      snackbar.add('Search Submitted. Redirecting to the data view');
    }
  }

  @boundMethod
  handleNewReviewUpdate(updatedReview) {
    this.setState({ newReview: updatedReview });
  }

  @boundMethod
  handleContentUpdate(content) {
    this.setState({ ...content });
  }

  render() {
    const {
      title, variant, onTopClick, modelName, onError, ...rest
    } = this.props;


    const {
      actionInProgress,
      reviewDialogOpen,
      newReview,
      ...content
    } = this.state;

    const snackbar = this.context;

    const actions = {
      [FORM_VARIANT.EDIT]: this.handleEditAction,
      [FORM_VARIANT.NEW]: this.handleNewAction,
      [FORM_VARIANT.SEARCH]: this.handleSearchAction,
    };

    return (
      <Paper className="record-form__wrapper" elevation={4}>
        <div className="record-form__header">
          <Typography variant="h1" className="title">{title}</Typography>
          <div className="header-action-buttons">
            {(content['@class'] === 'Statement' && variant === FORM_VARIANT.EDIT && (
            <Button
              onClick={() => this.setState({ reviewDialogOpen: true })}
              variant="outlined"
              disabled={actionInProgress}
            >
                Add Review
              <LocalLibraryIcon
                classes={{ root: 'review-icon' }}
              />
            </Button>
            ))}
            {onTopClick && (variant === FORM_VARIANT.VIEW || variant === FORM_VARIANT.EDIT) && (
              <ToggleButtonGroup
                onClick={() => onTopClick(content)}
                requireConfirm
                options={['view', 'edit']}
                variant={variant}
                message="Are you sure? You will lose your changes."
              />
            )}
          </div>
          <ReviewDialog
            isOpen={reviewDialogOpen}
            onClose={() => this.setState({ reviewDialogOpen: false })}
            content={content}
            newReview={newReview}
            updateNewReview={this.handleNewReviewUpdate}
            updateContent={this.handleContentUpdate}
            snackbar={snackbar}
            onError={onError}
          />
        </div>
        <BaseNodeForm
          {...rest}
          value={content}
          modelName={modelName}
          onSubmit={actions[variant] || null}
          onDelete={this.handleDeleteAction}
          reviewProps={{
            updateContent: this.handleContentUpdate,
            content,
          }}
          variant={variant}
          collapseExtra
          name="name"
          actionInProgress={actionInProgress}
        />
      </Paper>
    );
  }
}

export { RecordForm as RawRecordForm };

export default withKB(RecordForm);
