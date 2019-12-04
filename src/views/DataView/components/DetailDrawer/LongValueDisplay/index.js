
import {
  Collapse,
  Divider,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import React from 'react';

import schema from '@/services/schema';
import util from '@/services/util';

/**
   * Formats a key/value pair as a collapsible list item.
   * @property {string} name - property key.
   * @property {any} value - property value.
   * @property {boolean} isStatic - if true, locks list item open.
   * @property {boolean} isNested - if true, list item is indented.
   * @property {object} opened - array containing opened property models
   * @property {function} handleExpand - adds clicked props to opened object
   */
function LongValueDisplay(props) {
  const {
    name, value, isStatic, isNested, opened, handleExpand,
  } = props;

  const listItemProps = isStatic === true
    ? {}
    : { button: true, onClick: () => handleExpand(name) };
  const collapseProps = isStatic === true
    ? { in: true }
    : { in: !!opened.includes(name) };
  let itemIcon = null;

  if (isStatic !== true) {
    itemIcon = !opened.includes(name)
      ? <ExpandMoreIcon />
      : <ExpandLessIcon />;
  }
  return (
    <React.Fragment key={name}>
      <ListItem {...listItemProps} dense>
        {isNested && (
        <div className="nested-spacer" />
        )}
        <ListItemText className="detail-li-text">
          <Typography color={isNested ? 'textSecondary' : 'default'} variant="subtitle1">
            {util.antiCamelCase(name)}
          </Typography>
        </ListItemText>
        {itemIcon}
      </ListItem>
      <Collapse {...collapseProps} unmountOnExit>
        <ListItem dense>
          {isNested && (
          <div className="nested-spacer" />
          )}
          <ListItemText className="detail-li-text">
            {util.formatStr(schema.getPreview(value))}
          </ListItemText>
        </ListItem>
      </Collapse>
      <Divider />
    </React.Fragment>
  );
}

LongValueDisplay.propTypes = {
  isNested: PropTypes.bool.isRequired,
  isStatic: PropTypes.bool.isRequired,
  opened: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleExpand: PropTypes.func,
  name: PropTypes.string,
  value: PropTypes.object,
};

LongValueDisplay.defaultProps = {
  handleExpand: () => {},
  name: '',
  value: {},
};

export default LongValueDisplay;
