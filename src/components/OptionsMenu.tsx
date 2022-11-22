import {
  Collapse, ListItemIcon, ListItemText,
  MenuItem, MenuList,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import React, { ForwardedRef, forwardRef, useState } from 'react';

interface OptionsMenuProps {
  options: {
    label: string;
    content?: Record<string, unknown>;
    handler?: (...args: unknown[]) => unknown;
  }[];
  // eslint-disable-next-line react/require-default-props
  className?: string;
}

const OptionsMenu = forwardRef((props: OptionsMenuProps, ref: ForwardedRef<HTMLUListElement | null>) => {
  const { options, className } = props;
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

  const handleToggleOptionExpand = (option: string) => {
    setExpandedOption(option === expandedOption ? null : option);
  };

  return (
    <MenuList className={`options-menu ${className || ''}`} ref={ref}>
      {options.map((option) => {
        const { label, content, handler = () => {} } = option;
        const isOpen = expandedOption === label;

        if (content) {
          return (
            <div key={label}>
              <MenuItem onClick={() => handleToggleOptionExpand(label)}>
                <ListItemText>{label}</ListItemText>
                <ListItemIcon>
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemIcon>
              </MenuItem>
              <Collapse key={label} in={isOpen} timeout="auto" unmountOnExit>
                {content}
              </Collapse>
            </div>
          );
        }
        return (
          <MenuItem key={label} onClick={handler}>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        );
      })}
    </MenuList>
  );
});

export default OptionsMenu;
