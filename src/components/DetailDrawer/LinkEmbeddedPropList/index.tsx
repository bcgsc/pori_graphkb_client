import { ClassDefinition, PropertyDefinition as PropDefinition } from '@bcgsc-pori/graphkb-schema';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import React from 'react';

import RecordIdLink from '@/components/RecordIdLink';
import { GeneralRecordType } from '@/components/types';
import schema from '@/services/schema';
import util from '@/services/util';

interface LinkEmbeddedPropListProps {
  /** property formatting function */
  formatOtherProps: (arg: unknown, arg2: boolean) => unknown;
  /** adds prop to opened object and handles expansion */
  handleExpand?: (name: string) => unknown;
  /** props to be displayed for submenu */
  identifiers?: string[];
  /** is the prop nested */
  isNested?: boolean;
  /** opened dropdowns in drawer */
  opened?: string[];
  /** link/embedded property model */
  prop: PropDefinition;
  /** contains link/embedded records */
  value: GeneralRecordType;
}

/**
 * Renders formatted link/embedded props.
 */
function LinkEmbeddedPropList(props: LinkEmbeddedPropListProps) {
  const {
    prop, isNested = false, value = {}, identifiers = [], handleExpand, formatOtherProps, opened = [],
  } = props;
  const { name, type } = prop;
  let previewStr;
  let listItemProps = {};

  if (isNested) {
    previewStr = schema.getLabel(value);
  } else {
    listItemProps = { button: true, onClick: () => handleExpand?.(name) };
    previewStr = value?.displayName;

    if (type === 'embedded') {
      previewStr = value?.['@class'];
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
                          ? <RecordIdLink recordClass={value['@class'] as string} recordId={value[item] as string} />
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
