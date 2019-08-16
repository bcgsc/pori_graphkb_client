import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';

import {
  Link,
} from 'react-router-dom';

import {
  Dialog,
  Typography,
  AppBar,
  IconButton,
  DialogContent,
  TextField,
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';

import MenuIcon from '@material-ui/icons/Menu';
import Schema from '../../services/schema';
import FormField from './FormField';

import './index.scss';
import StatementTable from './StatementTable';
import ActionButton from '../ActionButton';
import { FORM_VARIANT } from './util';
import util from '../../services/util';

const schema = new Schema();
const grouping = [['createdAt', 'createdBy'], 'status', 'comment'];

class ReviewDialog extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    content: PropTypes.object.isRequired,
    reviewIndex: PropTypes.number.isRequired,
    snackbar: PropTypes.object.isRequired,
    handleEdit: PropTypes.func.isRequired,
    formVariant: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    const { content: initialContent, formVariant: initialMode } = props;
    this.state = {
      mode: initialMode,
      currContent: Object.assign({}, initialContent),
      newReview: {},
    };
  }


  @boundMethod
  handleOldReviewUpdate(event, prop) {
    const { reviewIndex } = this.props;
    const { currContent } = this.state;
    const newContent = Object.assign({}, currContent);
    newContent.reviews[reviewIndex][prop] = event;
    this.setState({ currContent: newContent });
  }

  @boundMethod
  handleNewReviewUpdate(event, prop) {
    const { newReview } = this.state;
    const updatedReview = Object.assign({}, newReview);
    updatedReview[prop] = event;
    this.setState({ newReview: updatedReview });
  }

  @boundMethod
  handleDelete() {
    const { reviewIndex, handleEdit, onClose } = this.props;
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
    }
  }

  @boundMethod
  handleEdit() {
    const { handleEdit, snackbar } = this.props;
    const { currContent } = this.state;
    const newContent = Object.assign({}, currContent);
    try {
      handleEdit({ content: newContent });
      this.setState({ mode: 'view' });
      snackbar.add('review has been successfully updated');
    } catch (err) {
      console.error(err);
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
    const reviewsClone = reviews.map(obj => ({ ...obj }));
    return reviewsClone;
  }

  @boundMethod
  handleAddReview() {
    const { newReview, currContent } = this.state;
    const {
      handleEdit, snackbar, auth: { user }, onClose, onError,
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

    const newContent = Object.assign({}, currContent);
    const clonedReviews = this.cloneReviews();
    newContent.reviews = clonedReviews;

    if (!newContent.reviews) {
      newContent.reviews = [
        updatedReview,
      ];
    } else {
      newContent.reviews.push(updatedReview);
    }

    try {
      handleEdit({ content: newContent });
      onClose();
    } catch (err) {
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
        if (!(formVariant === FORM_VARIANT.NEW)) {
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
              <div className="review-status-button">
                <FormField
                  model={prop}
                  value={review[name]}
                  onValueChange={(event) => { this.handleValueChange(event.target.value, propName); }}
                  schema={schema}
                  label={util.antiCamelCase(name)}
                  variant="view"
                  key={name}
                  content={currContent}
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
        fullScreen
        TransitionProps={{ unmountOnExit: true }}
      >
        <div className="review-dialog">
          <AppBar
            position="fixed"
            className="appbar"
          >
            <IconButton
              color="inherit"
              onClick={() => console.log('menu btn clicked')}
              className="appbar_-btn"
            >
              <MenuIcon />
            </IconButton>
            <div className={`appbar__title ${isOpen} ? 'appbar__title--drawer-open' : ''}`}>
              <Link to="/query" onClick={this.handleCloseNavBar}>
                <Typography variant="h6">GraphKB</Typography>
                <Typography variant="caption">v{process.env.npm_package_version}</Typography>
              </Link>
            </div>
          </AppBar>
          <div className="review-dialog__content">
            <div className={`review-dialog__header${formVariant === FORM_VARIANT.NEW ? '__new' : ''}`}>
              <div className="title">
                <Typography variant="title" color="secondary">
                Statement Review
                </Typography>
                <Typography variant="subtitle2" color="grey">
                  {description}
                </Typography>
              </div>
              <div className="action-buttons">
                {mode === 'view' && (
                <ActionButton
                  variant="outlined"
                  onClick={() => { this.setState({ mode: 'edit' }); }}
                  requireConfirm={false}
                >
                    Edit
                  <EditIcon />
                </ActionButton>
                )}
                {mode === 'edit' && (
                <ActionButton
                  variant="outlined"
                  onClick={() => { this.setState({ mode: 'view' }); }}
                  requireConfirm={false}
                >
                    view
                </ActionButton>
                )}
              </div>
            </div>
            <DialogContent className="review-dialog__fields">
              {this.renderFieldGroup(grouping, formVariant)}
              <StatementTable
                content={currContent}
                schema={schema}
              />
              {mode === 'edit' && (
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
                    SUBMIT
                  </ActionButton>
                </div>
              )

              }
            </DialogContent>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default ReviewDialog;
