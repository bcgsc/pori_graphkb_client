import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  TextField,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';

import SendIcon from '@material-ui/icons/Send';
import ActionButton from '../../ActionButton/index';
import { StyledMenu, StyledMenuItem } from '../../StyledMenu';

import './index.scss';
import { Authentication } from '../../../services/auth';

const REVIEW_STATUS = ['pending', 'not required', 'passed', 'failed', 'initial'];


class StatementReviewDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentVal: null,
      currReviewStatus: null,
      anchorEl: null,
    };
  }

  @boundMethod
  handleClick(event) {
    const { anchorEl } = this.state;

    if (!anchorEl) {
      this.setState({ anchorEl: event.currentTarget });
    } else {
      this.setState({ anchorEl: null });
    }
  }

  @boundMethod
  handleClose() {
    this.setState({ anchorEl: null });
  }

  @boundMethod
  handleMenuClick(opt) {
    this.setState({ currReviewStatus: opt, anchorEl: null });
  }

  @boundMethod
  handleSubmit() {
    console.log('submittings');
    const { currReviewStatus, currentVal } = this.state;
    console.log('TCL: StatementReviewDialog -> handleSubmit -> currReviewStatus, currentVal', currReviewStatus, currentVal);
    const { content, auth: { user } } = this.props;
    console.log('TCL: StatementReviewDialog -> handleSubmit -> user', user);
    console.log(this.props);
    const newContent = Object.assign({}, content);
    newContent.reviews = [];

    if (!currReviewStatus || !currentVal) {
      // grab snackbar and issue warning

    }
    const newReview = {
      '@class': 'StatementReview',
      createdBy: user['@rid'].slice(1),
      createdAt: (new Date()).valueOf(),
      comment: currentVal,
      reviewStatus: currReviewStatus,
    };
    // check if review is the first one ever created
    if (!newContent.reviews) {
      newContent.reviews = [
        newReview,
      ];
    } else {
      newContent.reviews.push(newReview);
    }

    console.log('TCL: StatementReviewDialog -> handleSubmit -> newContent', newContent);


    // send request

    // set state to isLoading

    // send request
  }

  renderReviewSelectBtn(reviewStatusOptions) {
    const { anchorEl, currReviewStatus } = this.state;

    const menuItems = [];
    reviewStatusOptions.forEach((opt) => {
      menuItems.push(
        <StyledMenuItem onClick={() => this.handleMenuClick(opt)}>
          <ListItemIcon>
            <SendIcon />
          </ListItemIcon>
          <ListItemText primary={opt} />
        </StyledMenuItem>,
      );
    });

    return (
      <div style={{ display: 'flex' }}>
        <ActionButton
          id="addFilterBtn"
          aria-controls="customized-menu"
          aria-haspopup="true"
          variant={currReviewStatus ? 'outlined' : 'contained'}
          color="secondary"
          onClick={this.handleClick}
          requireConfirm={false}
        >
          {currReviewStatus || 'Select Review Status'}
        </ActionButton>
        <StyledMenu
          id="customized-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={this.handleClose}
        >
          {menuItems}
        </StyledMenu>
      </div>
    );
  }

  render() {
    const { isOpen, onClose } = this.props;
    const { currentVal } = this.state;
    return (
      <Dialog
        open={isOpen}
        onClose={onClose}
        onEscapeKeyDown={onClose}
        maxWidth="md"
        fullWidth
        classes={{
          paper: 'statement-review-dialog',
        }}
        TransitionProps={{ unmountOnExit: true }}
      >
        <div className="statement-review-dialog__header">
          <DialogTitle>
            <Typography variant="title" color="secondary">
          Add Statement Review
            </Typography>
          </DialogTitle>
        </div>
        <div className="statement-review-dialog__content">
          <DialogContent>
            <div className="statement-review-dialog__subheader">
              <Typography variant="subtitle1" color="primary">
                  Description of adding a statement
              </Typography>
              {this.renderReviewSelectBtn(REVIEW_STATUS)}
            </div>
            <div className="statement-review-dialog__text-field">
              <TextField
                fullWidth
                helperText="Please remember to have your text in APA format"
                multiline
                rows={7}
                variant="outlined"
                value={currentVal}
                onChange={(event) => { this.setState({ currentVal: event.target.value }); }}
              />
            </div>
            <div className="statement-review-dialog__action_buttons">
              <ActionButton
                variant="outlined"
                color="secondary"
                requireConfirm={false}
                onClick={onClose}
              >
                Cancel
              </ActionButton>
              <ActionButton
                color="primary"
                variant="contained"
                requireConfirm
                onClick={this.handleSubmit}
              >
                Add Review
              </ActionButton>
            </div>
          </DialogContent>
        </div>
      </Dialog>
    );
  }
}

StatementReviewDialog.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  content: PropTypes.object.isRequired,
  auth: PropTypes.instanceOf(Authentication).isRequired,
};

StatementReviewDialog.defaultProps = {
  isOpen: false,
};

export default StatementReviewDialog;
