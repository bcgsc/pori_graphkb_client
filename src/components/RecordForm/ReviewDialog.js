import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';
import {
  Dialog,
  Typography,
  AppBar,
  IconButton,
  DialogContent,
  TextField,
  Tooltip,
} from '@material-ui/core';
import GoBackIcon from '@material-ui/icons/Replay';

import Schema from '../../services/schema';
import FormField from './FormField';
import './index.scss';
import StatementTable from './StatementTable';
import ActionButton from '../ActionButton';
import { FORM_VARIANT } from './util';
import util from '../../services/util';
import StyledSwitch from '../StyledSwitch';

const schema = new Schema();
const grouping = ['reviewStatus', 'status', ['createdAt', 'createdBy'], 'comment'];

/**
 * Dialog that handles the addition of statement reviews to a Statement
 * record or the modification of reviews. Dialog has 3 main variants,
 * ['new', 'edit, 'view']. The dialog is triggered open via the add review
 * statement button or by a related embedded detail chip link.
 *
 * @property {bool} props.isOpen flag to indicate whether dialog is open
 * @property {function} props.onClose handles closure of dialog
 * @property {object} props.content contains statement record info
 * @property {integer} props.reviewIndex index of the current review in reviews Array
 * @property {object} props.snackbar snackbar object for user feedback
 * @property {function} props.handleEdit parent function that handles edit action
 * @property {string} props.formVariant the variant of form depending on action
 * @property {object} props.auth Authorization object to mark who created review
 * @property {func} props.onError Parent error handler should something go wrong
 */
class ReviewDialog extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    content: PropTypes.object.isRequired,
    reviewIndex: PropTypes.number.isRequired,
    snackbar: PropTypes.object.isRequired,
    handleEdit: PropTypes.func.isRequired,
    formVariant: PropTypes.string.isRequired,
    auth: PropTypes.object.isRequired,
    onError: PropTypes.func.isRequired,
    updateNewReview: PropTypes.func.isRequired,
    newReview: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const {
      content: initialContent, formVariant: initialMode, content: { reviewStatus: initialStatementReviewStatus }, newReview,
    } = props;
    this.state = {
      mode: initialMode,
      currContent: Object.assign({}, initialContent),
      currReviewStatus: initialStatementReviewStatus,
      newReview,
    };
  }

  @boundMethod
  handleOldReviewUpdate(event, prop) {
    const { reviewIndex } = this.props;
    const { currContent, currReviewStatus } = this.state;
    const newContent = Object.assign({}, currContent);
    newContent.reviews[reviewIndex][prop] = event;
    const statusOfReview = newContent.reviews[reviewIndex].status;
    if (statusOfReview && statusOfReview !== currReviewStatus) {
      this.setState({ currReviewStatus: statusOfReview, currContent: newContent });
    } else {
      this.setState({ currContent: newContent });
    }
  }

  @boundMethod
  handleNewReviewUpdate(event, prop) {
    const { updateNewReview } = this.props;
    const { newReview: updatedReview, currReviewStatus } = this.state;
    updatedReview[prop] = event;
    if (updatedReview.status && currReviewStatus !== updatedReview.status) {
      this.setState({ newReview: updatedReview, currReviewStatus: updatedReview.status });
    } else {
      this.setState({ newReview: updatedReview });
    }
    updateNewReview(updatedReview);
  }

  @boundMethod
  handleDelete() {
    const {
      reviewIndex, handleEdit, onClose, onError,
    } = this.props;
    const { currContent } = this.state;

    const newContent = Object.assign({}, currContent);
    const clonedReviews = this.cloneReviews();
    newContent.reviews = clonedReviews;
    newContent.reviews.splice(reviewIndex, 1);

    try {
      handleEdit({ content: newContent });
      onClose();
    } catch (err) {
      console.error(err);
      onError(err);
    }
  }

  @boundMethod
  handleEdit() {
    const { handleEdit, snackbar, onError } = this.props;
    const { currContent } = this.state;
    let newContent = Object.assign({}, currContent);
    newContent = this.updateReviewStatus(newContent);

    try {
      handleEdit({ content: newContent });
      this.setState({ mode: FORM_VARIANT.VIEW });
      snackbar.add('review has been successfully updated');
    } catch (err) {
      console.error(err);
      onError(err);
    }
  }

  @boundMethod
  doesFormContainErrors() {
    const { newReview } = this.state;
    const propList = Object.keys(newReview);
    let formContainsError = false;
    if (propList.length !== 2) {
      formContainsError = true;
      return formContainsError;
    }
    propList.forEach((prop) => {
      if (!newReview[prop]) {
        formContainsError = true;
      }
    });
    return formContainsError;
  }

  @boundMethod
  cloneReviews() {
    const { currContent } = this.state;
    const { reviews } = currContent;
    if (reviews) {
      const reviewsClone = reviews.map(obj => ({ ...obj }));
      return reviewsClone;
    }
    return [];
  }

  @boundMethod
  updateReviewStatus(content) {
    const { currReviewStatus } = this.state;
    const newContent = Object.assign({}, content);
    if (newContent.reviewStatus !== currReviewStatus) {
      newContent.reviewStatus = currReviewStatus;
    }
    return newContent;
  }

  @boundMethod
  handleAddReview() {
    const { newReview, currContent } = this.state;
    const {
      handleEdit, snackbar, auth: { user }, onClose, onError, updateNewReview,
    } = this.props;

    const formContainsError = this.doesFormContainErrors();
    if (formContainsError) {
      snackbar.add('There are errors in the form which must be resolved before it can be submitted');
      return;
    }

    const updatedReview = {
      '@class': 'StatementReview',
      ...newReview,
      createdAt: (new Date()).valueOf(),
      createdBy: user['@rid'].slice(1),
    };

    let newContent = Object.assign({}, currContent);
    const clonedReviews = this.cloneReviews();
    newContent.reviews = clonedReviews;

    if (!newContent.reviews) {
      newContent.reviews = [
        updatedReview,
      ];
    } else {
      newContent.reviews.push(updatedReview);
    }

    newContent = this.updateReviewStatus(newContent);

    try {
      handleEdit({ content: newContent });
      updateNewReview({});
      onClose();
    } catch (err) {
      console.error(err);
      onError(err);
    }
  }

  @boundMethod
  handleValueChange(event, propName) {
    const { formVariant } = this.props;
    if (formVariant === FORM_VARIANT.NEW) {
      this.handleNewReviewUpdate(event, propName);
    } else {
      this.handleOldReviewUpdate(event, propName);
    }
  }

  @boundMethod
  handleReviewStatusChange(event) {
    this.setState({ currReviewStatus: event });
  }

  @boundMethod
  handleModeToggle() {
    const { mode } = this.state;
    if (mode === FORM_VARIANT.VIEW) {
      this.setState({ mode: FORM_VARIANT.EDIT });
    } else {
      this.setState({ mode: FORM_VARIANT.VIEW });
    }
  }

  @boundMethod
  renderReviewStatusField() {
    const {
      currContent, currReviewStatus, mode,
    } = this.state;

    const model = schema.get('Statement');
    const { properties: { reviewStatus } } = model;

    return (
      <FormField
        model={reviewStatus}
        value={currReviewStatus}
        onValueChange={event => this.handleReviewStatusChange(event.target.value)}
        schema={schema}
        variant="view"
        label="Overall Statement Status"
        content={currContent}
        disabled={
          mode === FORM_VARIANT.VIEW
        }
      />
    );
  }

  @boundMethod
  renderFieldGroup(ordering) {
    const {
      reviewIndex, formVariant,
    } = this.props;

    const {
      mode, currContent: { reviews }, currContent, newReview,
    } = this.state;

    let review = null;
    if (formVariant === FORM_VARIANT.NEW) {
      review = newReview;
    } else {
      review = reviews[reviewIndex];
    }

    const model = schema.get('StatementReview');
    const { properties } = model;

    const fields = [];
    ordering.forEach((propName) => {
      if (propName instanceof Array) { // subgrouping
        const key = propName.join('--');
        const subgroup = this.renderFieldGroup(propName);
        if (subgroup.length) {
          fields.push((
            <div key={key} className="record-form__content-subgroup">
              {subgroup}
            </div>
          ));
        }
      } else if (properties[propName]) {
        const prop = properties[propName];
        const { name } = prop;
        let wrapper;
        if (!(formVariant === FORM_VARIANT.NEW || name === 'status')) {
          wrapper = (
            <FormField
              model={prop}
              value={review[name]}
              onValueChange={(event) => { this.handleValueChange(event.target.value, propName); }}
              schema={schema}
              variant="view"
              label={util.antiCamelCase(name)}
              key={name}
              content={currContent}
              disabled={
              mode === FORM_VARIANT.VIEW || ['createdAt', 'createdBy'].includes(name)
            }
            />
          );
        } else if (!['createdAt', 'createdBy'].includes(name)) {
          if (name === 'comment') {
            wrapper = (
              <TextField
                fullWidth
                multiline
                rows={7}
                label="Review Description"
                variant="outlined"
                value={review[name]}
                onChange={(event) => { this.handleNewReviewUpdate(event.target.value, name); }}
              />
            );
          } else {
            wrapper = (
              <div className="statement-review-field">
                <FormField
                  model={prop}
                  value={review[name]}
                  onValueChange={(event) => { this.handleValueChange(event.target.value, propName); }}
                  schema={schema}
                  label="Review Status"
                  variant="view"
                  key={name}
                  content={currContent}
                  disabled={
                    mode === FORM_VARIANT.VIEW
                  }
                />
              </div>
            );
          }
        }
        fields.push(wrapper);
      }
    });
    return fields;
  }

  render() {
    const {
      isOpen, onClose, formVariant,
    } = this.props;
    const { currContent } = this.state;

    const { mode } = this.state;
    const model = schema.get('StatementReview');
    const { description } = model;
    return (
      <Dialog
        open={isOpen}
        onClose={onClose}
        onEscapeKeyDown={onClose}
        maxWidth="xl"
        fullWidth
        TransitionProps={{ unmountOnExit: true }}
      >
        <div className="review-dialog">
          <AppBar
            className="appbar"
            classes={{ positionFixed: 'custom-positionFixed' }}
          >
            <div className="appbar__title">
              <IconButton onClick={onClose}>
                <Typography variant="h6">GraphKB</Typography>
                <Typography variant="caption">v{process.env.npm_package_version}</Typography>
              </IconButton>
            </div>
            <Tooltip title="Go back to Statement Record">
              <IconButton
                color="inherit"
                onClick={onClose}
                className="appbar__btn"
              >
                <GoBackIcon />
              </IconButton>
            </Tooltip>
          </AppBar>
          <div className="review-dialog__content">
            <div className="review-dialog__header">
              <div className="title">
                <Typography variant="title" color="secondary">
                Statement Review
                </Typography>
                <Typography variant="subtitle2" color="grey">
                  {description}
                </Typography>
              </div>
              <div className="action-buttons">
                {formVariant !== FORM_VARIANT.NEW && (
                  <StyledSwitch
                    onClick={this.handleModeToggle}
                    checked={mode === FORM_VARIANT.EDIT}
                    opt1="View"
                    opt2="Edit"
                    color="primary"
                  />
                )}
              </div>
            </div>
            <div className="overall-statement-status-field">
              {this.renderReviewStatusField()}
            </div>
            <DialogContent className="review-dialog__fields">
              {this.renderFieldGroup(grouping)}
              <StatementTable
                content={currContent}
                schema={schema}
              />
            </DialogContent>
            {mode === FORM_VARIANT.EDIT && (
            <div className="review-dialog__content__action-buttons">
              <ActionButton
                onClick={this.handleDelete}
                variant="outlined"
                size="large"
                message="Are you sure you want to delete this review"
              >
                    DELETE
              </ActionButton>
              <ActionButton
                onClick={this.handleEdit}
                variant="contained"
                color="primary"
                size="large"
                requireConfirm={false}
              >
                    SUBMIT CHANGES
              </ActionButton>
            </div>
            )}
            { formVariant === FORM_VARIANT.NEW && (
            <div className="review-dialog__content__submit-button">
              <ActionButton
                onClick={this.handleAddReview}
                variant="contained"
                color="primary"
                size="large"
                requireConfirm={false}
              >
                    ADD REVIEW
              </ActionButton>
            </div>
            )

              }
          </div>
        </div>
      </Dialog>
    );
  }
}

export default ReviewDialog;
