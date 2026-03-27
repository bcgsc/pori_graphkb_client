import './index.scss';

import TreeIcon from '@mui/icons-material/AccountTree';
import HelpIcon from '@mui/icons-material/HelpOutline';
import ShareIcon from '@mui/icons-material/Share';
import { IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import HelpDialog from './HelpDialog';

interface RecordFormStateToggleProps {
  disabled?: boolean;
  /** parent handler function to toggle states */
  onChange?: (arg: { target: { value: unknown } }) => void;
  /** starting variant value */
  value?: '' | 'keyword' | 'tree';
}

/**
 * Toggle Button Navigation to switch between modes or settings.
 */
function RecordFormStateToggle({
  onChange,
  value: inputValue,
  disabled,
}: RecordFormStateToggleProps) {
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
      <IconButton onClick={toggleHelp} size="large"><HelpIcon /></IconButton>
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
