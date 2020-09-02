import './index.scss';

import { IconButton } from '@material-ui/core';
import TreeIcon from '@material-ui/icons/AccountTree';
import HelpIcon from '@material-ui/icons/HelpOutline';
import ShareIcon from '@material-ui/icons/Share';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import HelpDialog from './HelpDialog';

/**
 * Toggle Button Navigation to switch between modes or settings.
 *
 * @property {object} props
 * @property {function} props.onClick parent handler function to toggle states
 * @property {bool} props.requireConfirm flag to check whether confirmation is needed
 * @property {string} props.message message displayed in confirmation dialog
 * @property {string} props.value starting variant value
 */
function RecordFormStateToggle({
  onChange,
  value: inputValue,
  disabled,
}) {
  const [value, setValue] = useState(inputValue);
  const [helpIsOpen, setHelpIsOpen] = useState(false);

  useEffect(() => {
    setValue(inputValue);
  }, [inputValue]);

  const handleChange = useCallback((event, newValue) => {
    if (value !== newValue) {
      setValue(newValue);
      onChange({ target: { value: newValue } });
    }
  }, [onChange, value]);

  const toggleHelp = useCallback(() => {
    setHelpIsOpen(!helpIsOpen);
  }, [helpIsOpen]);


  return (
    <div>
      <ToggleButtonGroup
        aria-label="subquery toggle"
        className="subquery-toggle"
        exclusive
        label="subquery type"
        onChange={handleChange}
        value={value}
      >
        <ToggleButton
          aria-label="graph"
          data-testid="graph-view"
          disabled={disabled}
          value=""
        >
          <span className="toggle-option__text">no subquery</span>
        </ToggleButton>
        <ToggleButton
          aria-label="tree"
          disabled={disabled}
          value="tree"
        >
          <TreeIcon /><span className="toggle-option__text">Tree</span>
        </ToggleButton>
        <ToggleButton
          aria-label="keyword"
          disabled={disabled}
          value="keyword"
        >
          <ShareIcon /><span className="toggle-option__text">keyword</span>
        </ToggleButton>
      </ToggleButtonGroup>
      <IconButton onClick={toggleHelp}><HelpIcon /></IconButton>
      <HelpDialog isOpen={helpIsOpen} onClose={() => setHelpIsOpen(false)} />
    </div>
  );
}

RecordFormStateToggle.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.oneOf(['', 'keyword', 'tree']),
};

RecordFormStateToggle.defaultProps = {
  onChange: () => {},
  value: '',
  disabled: false,
};

export default RecordFormStateToggle;
