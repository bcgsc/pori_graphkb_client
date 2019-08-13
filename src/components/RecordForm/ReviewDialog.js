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
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';

import MenuIcon from '@material-ui/icons/Menu';
import Schema from '../../services/schema';
import FormField from './FormField';

import './index.scss';
import StatementTable from './StatementTable';
import ActionButton from '../ActionButton';

const schema = new Schema();
const grouping = [['createdAt', 'createdBy'], 'reviewStatus', 'comment'];

class ReviewDialog extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    content: PropTypes.object.isRequired,
    reviewIndex: PropTypes.number.isRequired,
    snackbar: PropTypes.object.isRequired,
    handleEdit: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    const { content: initialContent } = props;
    this.state = {
      mode: 'view',
      currContent: initialContent,
    };
  }


  @boundMethod
  handleContentUpdate(event, prop) {
    const { reviewIndex } = this.props;
    const { currContent } = this.state;
    const newContent = Object.assign({}, currContent);
    newContent.reviews[reviewIndex][prop] = event;
    this.setState({ currContent: newContent });
  }

  @boundMethod
  handleDelete() {
    const { reviewIndex, handleEdit, onClose } = this.props;
    const { currContent } = this.state;
    const newContent = Object.assign({}, currContent);
    newContent.reviews.splice(reviewIndex, 1);
    try {
      // handleEdit({ content: newContent });
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
      // handleEdit({ content: newContent });
      this.setState({ mode: 'view' });
      snackbar.add('review has been successfully updated');
    } catch (err) {
      console.error(err);
    }
  }

  @boundMethod
  renderFieldGroup(ordering) {
    const {
      reviewIndex,
    } = this.props;
    const { mode, currContent: { reviews }, currContent } = this.state;
    const review = reviews[reviewIndex];
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
        const wrapper = (
          <FormField
            model={prop}
            value={review[name]}
            onValueChange={(event) => { this.handleContentUpdate(event.target.value, propName); }}
            schema={schema}
            variant="view"
            key={name}
            content={currContent}
            disabled={
              mode === 'view' || ['createdAt', 'createdBy'].includes(name)
            }
          />
        );
        fields.push(wrapper);
      }
    });
    return fields;
  }

  render() {
    const {
      isOpen, onClose, content,
    } = this.props;

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
            <DialogContent>
              {this.renderFieldGroup(grouping)}
              <StatementTable
                content={content}
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
            </DialogContent>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default ReviewDialog;
