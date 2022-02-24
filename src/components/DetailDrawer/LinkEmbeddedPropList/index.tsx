import {
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import React from 'react';

import RecordIdLink from '@/components/RecordIdLink';
import schema from '@/services/schema';
import util from '@/services/util';

interface LinkEmbeddedPropListProps {
  /** property formatting function */
  formatOtherProps(...args: unknown[]): unknown;
  /** adds prop to opened object and handles expansion */
  handleExpand?(...args: unknown[]): unknown;
  /** props to be displayed for submenu */
  identifiers?: object[];
  /** is the prop nested */
  isNested?: boolean;
  /** opened dropdowns in drawer */
  opened?: string[];
  /** link/embedded property model */
  prop?: object;
  /** contains link/embedded records */
  value?: object;
}

/**
 * Renders formatted link/embedded props.
 */
function LinkEmbeddedPropList(props: LinkEmbeddedPropListProps) {
  const {
    prop = {}, isNested, value = {}, identifiers = [], handleExpand, formatOtherProps, opened = [],
  } = props;
  const { name, type } = prop;
  let previewStr;
  let listItemProps = {};

  if (isNested) {
    previewStr = schema.getLabel(value);
  } else {
    listItemProps = { button: true, onClick: () => handleExpand(name) };
    previewStr = value.displayName;

    if (type === 'embedded') {
      previewStr = value['@class'];
    }
  }
  return (
    <React.Fragment key={name}>
      <ListItem {...listItemProps} dense>
        {isNested && (
          <div className="nested-spacer" />
        )}
        <ListItemText className="detail-li-text">
          <div className="detail-identifiers">
            <Typography variant="body1">
              {util.antiCamelCase(name)}
            </Typography>
            <Typography>
              {previewStr}
            </Typography>
          </div>
        </ListItemText>
        {!isNested && (!opened.includes(name) ? <ExpandMoreIcon /> : <ExpandLessIcon />)}
      </ListItem>
      {!isNested && (
        <Collapse in={!!opened.includes(name)} unmountOnExit>
          <List className="detail-drawer__nested-list" dense disablePadding>
            {type === 'link' && (
              [value['@class'], '@rid', 'sourceId'].map((item, index) => (
                <ListItem key={item} dense>
                  <div className="nested-spacer" />
                  <ListItemText className="detail-li-text">
                    <div className="detail-identifiers">
                      <Typography variant="subtitle1">
                        {util.antiCamelCase(item)}
                      </Typography>
                      <Typography>
                        {item === '@rid'
                          ? <RecordIdLink recordClass={value['@class']} recordId={value[item]} />
                          : value[identifiers[index]]}
                      </Typography>
                    </div>
                  </ListItemText>
                </ListItem>
              ))
            )}
            {type === 'embedded' && formatOtherProps(value, true)}
          </List>
        </Collapse>
      )}
      <Divider />
    </React.Fragment>
  );
}

LinkEmbeddedPropList.defaultProps = {
  handleExpand: () => {},
  identifiers: [],
  isNested: false,
  opened: [],
  prop: {},
  value: {},
};

export default LinkEmbeddedPropList;
