import React from 'react';
import {
  MenuList, MenuItem, Collapse, ListItemIcon, ListItemText,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';


class OptionsMenu extends React.Component {
  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({ label: PropTypes.string.isRequired, content: PropTypes.object, handler: PropTypes.func }),
    ).isRequired,
    className: PropTypes.string,
  };

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
  handleToggleOptionExpand(option) {
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
