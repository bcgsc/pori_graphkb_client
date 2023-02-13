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
import { GeneralRecordType, PropertyDefinition } from '@/components/types';
import schema from '@/services/schema';
import util from '@/services/util';

const identifiers = ['displayName', '@rid', 'sourceId'];

interface LinkEmbeddedPropListProps {
  /** property formatting function */
  formatOtherProps: (record: GeneralRecordType, isNested: boolean) => unknown;
  /** adds prop to opened object and handles expansion */
  handleExpand: (name: string | GeneralRecordType) => unknown;
  /** is the prop nested */
  isNested: boolean | undefined;
  /** opened dropdowns in drawer */
  opened: (string | GeneralRecordType)[];
  /** link/embedded property model */
  prop: PropertyDefinition;
  /** contains link/embedded records */
  value: GeneralRecordType;
}

/**
 * Renders formatted link/embedded props.
 */
function LinkEmbeddedPropList(props: LinkEmbeddedPropListProps) {
  const {
    prop, isNested, value, handleExpand, formatOtherProps, opened,
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

export default LinkEmbeddedPropList;
