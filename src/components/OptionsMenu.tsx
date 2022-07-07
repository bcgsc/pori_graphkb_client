import {
  Collapse, ListItemIcon, ListItemText,
  MenuItem, MenuList,
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { boundMethod } from 'autobind-decorator';
import React from 'react';

interface OptionsMenuProps {
  options: {
    label: string;
    content?: Record<string, unknown>;
    handler?: (...args: unknown[]) => unknown;
  }[];
  className?: string;
}

class OptionsMenu extends React.Component<OptionsMenuProps, { expandedOption: string | null }> {
  static defaultProps = {
    className: '',
  };

  constructor(props) {
    super(props);
    this.state = {
      expandedOption: null,
    };
  }

  @boundMethod
  handleToggleOptionExpand(option: string) {
    const { expandedOption } = this.state;

    if (option === expandedOption) {
      this.setState({ expandedOption: null });
    } else {
      this.setState({ expandedOption: option });
    }
  }

  render() {
    const { options, className } = this.props;
    const { expandedOption } = this.state;
    return (
      <MenuList className={`options-menu ${className || ''}`}>
        {options.map((option) => {
          const { label, content, handler = () => {} } = option;
          const isOpen = expandedOption === label;

          if (content) {
            return (
              <div key={label}>
                <MenuItem onClick={() => this.handleToggleOptionExpand(label)}>
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
  }
}

export default OptionsMenu;
