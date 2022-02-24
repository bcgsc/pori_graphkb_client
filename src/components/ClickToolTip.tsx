/* eslint-disable react/static-property-placement */
import {
  ClickAwayListener,
  Tooltip,
} from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import { boundMethod } from 'autobind-decorator';
import React from 'react';

interface ClickToolTipProps {
  className?: string;
  style?: object;
  /** the text to be displayed */
  title?: string;
}

/**
 * Tooltip that will work on mobile and brings up the
 * help message by click/focus/hover etc
 *
 * Any extra arguments passed as props are applied to the inner Tooltip Component
 */
class ClickToolTip extends React.Component<ClickToolTipProps, { isOpen: boolean }> {
  static defaultProps = {
    title: '',
    className: '',
    style: { cursor: 'default' },
  };

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  @boundMethod
  handleSwitch() {
    const { isOpen } = this.state;
    this.setState({ isOpen: !isOpen });
  }

  @boundMethod
  handleClose() {
    this.setState({ isOpen: false });
  }

  @boundMethod
  handleOpen() {
    this.setState({ isOpen: true });
  }

  render() {
    const {
      title, style, className, ...rest
    } = this.props;
    const { isOpen } = this.state;

    if (!title) {
      return null;
    }

    return (
      <ClickAwayListener onClickAway={this.handleClose}>
        <div>
          <Tooltip
            className={`click-tool-tip ${className}`}
            onClick={this.handleSwitch}
            onClose={this.handleClose}
            onFocus={this.handleOpen}
            onMouseEnter={this.handleOpen}
            onOpen={this.handleOpen}
            open={isOpen}
            PopperProps={{
              disablePortal: true,
              open: isOpen,
            }}
            style={style}
            title={title}
            {...rest}
          >
            <HelpIcon aria-label="show tooltip" color="primary" focusable />
          </Tooltip>
        </div>
      </ClickAwayListener>
    );
  }
}

export default ClickToolTip;
