import './index.scss';

import { IconButton } from '@material-ui/core';
import TreeIcon from '@material-ui/icons/AccountTree';
import HelpIcon from '@material-ui/icons/HelpOutline';
import ShareIcon from '@material-ui/icons/Share';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import React, { useCallback, useEffect, useState } from 'react';

import HelpDialog from './HelpDialog';

interface RecordFormStateToggleProps {
  disabled?: boolean;
  onChange?: (e: { target: { value: unknown } }) => void;
  /** starting variant value */
  value?: '' | 'keyword' | 'tree';
}

/**
 * Toggle Button Navigation to switch between modes or settings.
 */
function RecordFormStateToggle(props: RecordFormStateToggleProps) {
  const {
    onChange = () => {},
    value: inputValue,
    disabled,
  } = props;
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
          aria-label="exact"
          data-testid="graph-view"
          disabled={disabled}
          value=""
        >
          <span className="toggle-option__backup-icon">E</span><span className="toggle-option__text">exact match</span>
        </ToggleButton>
        <ToggleButton
          aria-label="keyword"
          disabled={disabled}
          value="keyword"
        >
          <ShareIcon /><span className="toggle-option__text">keyword</span>
        </ToggleButton>
        <ToggleButton
          aria-label="tree"
          disabled={disabled}
          value="tree"
        >
          <TreeIcon /><span className="toggle-option__text">Subclass Tree</span>
        </ToggleButton>
      </ToggleButtonGroup>
      <IconButton onClick={toggleHelp}><HelpIcon /></IconButton>
      <HelpDialog isOpen={helpIsOpen} onClose={() => setHelpIsOpen(false)} />
    </div>
  );
}

RecordFormStateToggle.defaultProps = {
  onChange: () => {},
  value: '',
  disabled: false,
};

export default RecordFormStateToggle;
