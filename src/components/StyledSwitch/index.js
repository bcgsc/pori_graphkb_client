import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import colors from '../../_theme.scss';
import './index.scss';

const ColoredSwitch = withStyles({
  switchBase: {
    color: colors.secondaryMain,
    '&$checked': {
      color: colors.primaryMain,
    },
    '&$checked + $track': {
      backgroundColor: colors.primaryMain,
    },
  },
  checked: {},
  track: {},
})(Switch);

/**
 * @property {object} props
 * @property {bool} props.onClick parent onClick handler
 * @property {string} props.opt1 first option
 * @property {string} props.opt2 second option
 * @property {function} props.color primary color of switch
 */
function StyledSwitch(props) {
  const {
    onClick, checked, opt1, opt2, color,
  } = props;

  return (
    <div className="toggle-switch">
      <Typography variant="h5">{opt1}</Typography>
      <ColoredSwitch
        color={color}
        onClick={() => onClick()}
        checked={checked}
      />
      <Typography variant="h5">{opt2}</Typography>
    </div>
  );
}

StyledSwitch.propTypes = {
  onClick: PropTypes.func,
  checked: PropTypes.bool,
  opt1: PropTypes.string,
  opt2: PropTypes.string,
  color: PropTypes.string,
};

StyledSwitch.defaultProps = {
  onClick: () => {},
  checked: false,
  opt1: 'OPTION1',
  opt2: 'OPTION2',
  color: 'primary',
};

export default StyledSwitch;
