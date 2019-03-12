import React from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';
import {
  Tooltip,
  ClickAwayListener,
} from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';


/**
 * Tooltip that will work on mobile and brings up the
 * help message by click/focus/hover etc
 *
 * @property {object} props
 * @property {string} props.title the text to be displayed
 *
 * Any extra arguments passed as props are applied to the inner Tooltip Component
 */
class ClickToolTip extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
  };

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
            PopperProps={{
              disablePortal: true,
              open: isOpen,
            }}
            onOpen={this.handleOpen}
            onClose={this.handleClose}
            onClick={this.handleSwitch}
            onFocus={this.handleOpen}
            onMouseEnter={this.handleOpen}
            open={isOpen}
            title={title}
            style={style}
            className={`click-tool-tip ${className}`}
            {...rest}
          >
            <HelpIcon color="primary" focusable />
          </Tooltip>
        </div>
      </ClickAwayListener>
    );
  }
}


export default ClickToolTip;
