import {
  Collapse,
  Divider,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React from 'react';

import schema from '@/services/schema';
import util from '@/services/util';

const DATE_KEYS = ['createdAt', 'deletedAt', 'updatedAt'];
const MAX_STRING_LENGTH = 64;

interface TextRowProps {
  /** if true, list item is indented. */
  isNested: boolean;
  /** if true, locks list item open. */
  isStatic: boolean;
  /** array containing opened property models */
  opened: Record<string, unknown>[];
  /** adds clicked props to opened object */
  handleExpand?: (name?: string) => void;
  /** property key. */
  name?: string;
  /** property value */
  value?: Record<string, unknown>;
}

/**
 * Formats a key/value pair where string is value. Either formats it
 * as a string row or a collapsable row depending on length
 */
function TextRow(props: TextRowProps) {
  const {
    name, value, isStatic, isNested, opened, handleExpand,
  } = props;

  const LongValue = () => {
    const listItemProps = isStatic
      ? {}
      : { button: true, onClick: () => handleExpand(name) };
    const collapseProps = isStatic
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
          {isNested && <div className="nested-spacer" />}
          <ListItemText className="detail-li-text">
            <Typography color={isNested ? 'textSecondary' : 'default'}>
              {util.antiCamelCase(name)}
            </Typography>
          </ListItemText>
          {itemIcon}
        </ListItem>
        <Collapse {...collapseProps} unmountOnExit>
          <ListItem dense>
            {isNested && <div className="nested-spacer" />}
            <ListItemText className="detail-li-text">
              {util.formatStr(schema.getPreview(value))}
            </ListItemText>
          </ListItem>
        </Collapse>
        <Divider />
      </React.Fragment>
    );
  };

  const shortValue = () => {
    let Wrapper = React.Fragment;
    const compProps = {};

    if (name === 'url') {
      Wrapper = 'a';
      compProps.href = value;
      compProps.target = '_blank';
    }
    return (
      <React.Fragment key={name}>
        <ListItem dense>
          {isNested && <div className="nested-spacer" />}
          <ListItemText className="detail-li-text">
            <div className="detail-identifiers">
              <Typography>
                {util.antiCamelCase(name)}
              </Typography>
              <Wrapper {...compProps}>
                <Typography>
                  {DATE_KEYS.includes(name)
                    ? (new Date(value)).toLocaleString()
                    : util.formatStr(schema.getLabel(value))}
                </Typography>
              </Wrapper>
            </div>
          </ListItemText>
        </ListItem>
        <Divider />
      </React.Fragment>
    );
  };

  let formattedString;

  if (value.toString().length <= MAX_STRING_LENGTH) {
    formattedString = shortValue();
  } else {
    formattedString = LongValue();
  }

  return formattedString;
}

TextRow.defaultProps = {
  handleExpand: () => {},
  name: '',
  value: {},
};

export default TextRow;
