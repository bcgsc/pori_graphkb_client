import React, { Component } from 'react';
import PropTypes, { string } from 'prop-types';
import { boundMethod } from 'autobind-decorator';

import {
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';

import SendIcon from '@material-ui/icons/Send';
import ActionButton from '../ActionButton';
import { StyledMenu, StyledMenuItem } from './StyledMenu';

class DropDownMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currVal: null,
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
    const { handleMenuClick } = this.props;
    this.setState({ currVal: opt });
    handleMenuClick(opt);
  }


  render() {
    const { options, defaultValue } = this.props;
    const { anchorEl, currVal } = this.state;
    const menuItems = [];
    options.forEach((opt) => {
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
          variant={currVal ? 'outlined' : 'contained'}
          color="secondary"
          onClick={this.handleClick}
          requireConfirm={false}
        >
          {currVal || defaultValue}
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
}

DropDownMenu.propTypes = {
  options: PropTypes.arrayOf(string).isRequired,
  handleMenuClick: PropTypes.func.isRequired,
  defaultValue: PropTypes.string,
};

DropDownMenu.defaultProps = {
  defaultValue: 'Select an option',
};

export default DropDownMenu;
