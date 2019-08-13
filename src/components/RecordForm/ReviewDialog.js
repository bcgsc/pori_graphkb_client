import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';

import {
  Dialog,
  DialogTitle,
  Typography,
  AppBar,
  IconButton,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import Schema from '../../services/schema';
import FormField from './FormField';

const schema = new Schema();
const grouping = [['createdAt', 'createdBy'], 'reviewStatus', 'comment'];

class ReviewDialog extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    content: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  @boundMethod
  renderFieldGroup(ordering) {
    const {
      content,
    } = this.props;
    const model = schema.get('StatementReview');
    const { properties } = model;

    const fields = [];

    ordering.forEach((item) => {
      if (item instanceof Array) { // subgrouping
        const key = item.join('--');
        const subgroup = this.renderFieldGroup(item);
        if (subgroup.length) {
          fields.push((
            <div key={key} className="record-form__content-subgroup">
              {subgroup}
            </div>
          ));
        }
      } else if (properties[item]) {
        const prop = properties[item];
        const { name } = prop;
        const wrapper = (
          <FormField
            model={prop}
            value={content ? content[name] : {}}
            onValueChange={(event) => { console.log(event); }}
            schema={schema}
            variant="view"
            key={name}
            content={content}
            disabled
          />
        );
        fields.push(wrapper);
      }
    });
    return fields;
  }

  render() {
    const {
      isOpen, onClose,
    } = this.props;
    return (
      <Dialog
        open={isOpen}
        onClose={onClose}
        onEscapeKeyDown={onClose}
        fullScreen
        TransitionProps={{ unmountOnExit: true }}
      >
        <div className="embedded-record">
          <AppBar
            position="fixed"
          >
            <IconButton>
              <MenuIcon />
            </IconButton>
            <div className={`appbar__title ${isOpen} ? 'appbar__title--drawer-open' : ''}`}>
              <Typography variant="h6">GraphKB</Typography>
              <Typography variant="caption">v{process.env.npm_package_version}</Typography>
            </div>
          </AppBar>
          <div className="embedded-record__content">
            <DialogTitle>
              <Typography variant="title" color="secondary">
                Statement Review
              </Typography>
              {this.renderFieldGroup(grouping)}
            </DialogTitle>
          </div>
        </div>
      </Dialog>
    );
  }
}

export default ReviewDialog;
