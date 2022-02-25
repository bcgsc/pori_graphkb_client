/**
 * @module /components/DetailDrawer/SetDrawerDisplay
 */
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

/**
   * sorts properties alphabetically by class and then displayname
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

interface SetPropsListProps {
  handleExpand?(...args: unknown[]): unknown;
  /** props to be displayed for submenu */
  identifiers?: string[];
  /** opened dropdowns in drawer */
  opened?: string[];
  /** link/embedded property model */
  prop?: object;
  /** contains link/embedded records */
  value?: object;
}

/**
   * Renders properties that are set types. i.e Embedded set and link set.
   */
function SetPropsList(props: SetPropsListProps) {
  const {
    prop = {}, value = {}, identifiers = [], opened = [], handleExpand = () => {},
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
        {type === 'linkset' && values.map((item) => (
          <>
            <ListItem key={item['@rid']} button dense onClick={() => handleExpand(item)}>
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
              {!opened.includes(item) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </ListItem>
            <Collapse in={!!opened.includes(item)} unmountOnExit>
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
                            : item[propName]}
                        </Typography>
                      </div>
                    </ListItemText>
                  </ListItem>
                </List>
              ))}
            </Collapse>
          </>
        ))}
        { type === 'embeddedset' && values.map((item) => (
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

SetPropsList.defaultProps = {
  handleExpand: () => {},
  identifiers: [],
  opened: [],
  prop: {},
  value: {},
};

export default SetPropsList;
