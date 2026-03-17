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

/**
   * sorts properties alphabetically by class and then displayname
   *
   * @param {Arrayof.<Objects>} value holds an array of Property Models
   */
const sortProps = (value) => {
  const sortedValues = value.sort((a, b) => {
    if (a['@class'] === b['@class']) {
      return a.displayName.localeCompare(b.displayName);
    }
    return a['@class'].localeCompare(b['@class']);
  });
  return sortedValues;
};

interface SetPropsListProps<V extends GeneralRecordType | string> {
  handleExpand?: (arg: V) => void;
  /** props to be displayed for submenu */
  identifiers?: unknown[];
  /** opened dropdowns in drawer */
  opened?: V[];
  /** link/embedded property model */
  prop?: { name?: string; type?: string };
  /** contains link/embedded records */
  value?: V[];
}

/**
 * Renders properties that are set types. i.e Embedded set and link set.
 */
function SetPropsList<V extends GeneralRecordType | string>(props: SetPropsListProps<V>) {
  const {
    prop = {}, value = [], identifiers = [], opened = [], handleExpand,
  } = props;
  const { type, name } = prop;
  if (value.length === 0) return null;
  let values = [...value];

  if (type === 'linkset') {
    values = sortProps(values);
  }
  return (
    <React.Fragment key={name}>
      <ListItem dense>
        <ListItemText className="detail-li-text">
          <Typography>
            {util.antiCamelCase(name)}
          </Typography>
        </ListItemText>
      </ListItem>
      <List dense disablePadding>
        {type === 'linkset' && (values as GeneralRecordType<'@rid' | '@class'>[]).map((item) => (
          <>
            <ListItem key={item['@rid']} dense onClick={() => handleExpand?.(item as V)}>
              <div className="nested-spacer" />
              <ListItemText className="detail-li-text">
                <div className="detail-identifiers-linkset">
                  <Typography color="textSecondary">
                    {util.antiCamelCase(item['@class'])}
                  </Typography>
                  <Typography color="textSecondary">
                    {schema.getLabel(item)}
                  </Typography>
                </div>
              </ListItemText>
              {!opened.includes(item as V) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </ListItem>
            <Collapse in={!!opened.includes(item as V)} unmountOnExit>
              {identifiers.map((propName) => (
                <List dense disablePadding>
                  <ListItem>
                    <ListItemText>
                      <div className="detail-identifiers">
                        <Typography className="detail-identifiers-nested" variant="subtitle1">
                          {util.antiCamelCase(propName)}
                        </Typography>
                        <Typography variant="h6">
                          {propName === '@rid'
                            ? <RecordIdLink recordClass={item['@class']} recordId={item[propName]} />
                            : item[String(propName)]}
                        </Typography>
                      </div>
                    </ListItemText>
                  </ListItem>
                </List>
              ))}
            </Collapse>
          </>
        ))}
        { type === 'embeddedset' && (values as string[]).map((item) => (
          <ListItem key={item} dense>
            <div className="nested-spacer" />
            <ListItemText
              className="detail-li-text"
              inset
              primary={util.formatStr(item)}
            />
          </ListItem>
        )) }
      </List>
      <Divider />
    </React.Fragment>
  );
}

export default SetPropsList;
