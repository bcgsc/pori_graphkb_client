import { GraphRecord, schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Collapse,
  Divider,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { ReactNode } from 'react';

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
  opened: string[];
  /** adds clicked props to opened object */
  handleExpand?: (name: string) => void;
  /** property key. */
  name: string;
  /** property value */
  value?: unknown;
}

/**
 * Formats a key/value pair where string is value. Either formats it
 * as a string row or a collapsable row depending on length
 */
function TextRow(props: TextRowProps) {
  const {
    name = '', value = {}, isStatic, isNested, opened, handleExpand,
  } = props;

  const LongValue = () => {
    const listItemProps = isStatic
      ? {}
      : { button: true, onClick: () => handleExpand?.(name) };
    const collapseProps = isStatic
      ? { in: true }
      : { in: !!opened.includes(name) };
    let itemIcon: ReactNode = null;

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
              {util.formatStr(schemaDefn.getPreview(value as GraphRecord))}
            </ListItemText>
          </ListItem>
        </Collapse>
        <Divider />
      </React.Fragment>
    );
  };

  const shortValue = () => {
    let innerContent: ReactNode = (
      <Typography>
        {DATE_KEYS.includes(name)
          ? (new Date(value as string)).toLocaleString()
          : util.formatStr(schema.getLabel(value))}
      </Typography>
    );

    if (name === 'url') {
      innerContent = (
        <a href={value as string} rel="noreferrer" target="_blank">
          {innerContent}
        </a>
      );
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
              {innerContent}
            </div>
          </ListItemText>
        </ListItem>
        <Divider />
      </React.Fragment>
    );
  };

  let formattedString;

  if ((value as any).toString().length <= MAX_STRING_LENGTH) {
    formattedString = shortValue();
  } else {
    formattedString = LongValue();
  }

  return formattedString;
}

export default TextRow;
