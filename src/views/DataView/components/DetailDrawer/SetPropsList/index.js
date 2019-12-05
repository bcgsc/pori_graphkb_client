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
import PropTypes from 'prop-types';
import React from 'react';

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

/**
   * Renders properties that are set types. i.e Embedded set and link set.
   * @param {PropertyModel} prop link/embedded property model
   * @param {Arrayof<Objects>}  value contains link/embedded records
   * @param {Arrayof<string>} opened opened dropdowns in drawer
   * @param {Arrayof<string>} identifiers props to be displayed for submenu
   *
   */
function SetPropsList(props) {
  const {
    prop, value, identifiers, opened, handleExpand,
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
          <Typography variant="subtitle1">
            {util.antiCamelCase(name)}
          </Typography>
        </ListItemText>
      </ListItem>
      <List dense disablePadding>
        {type === 'linkset' && values.map(item => (
          <>
            <ListItem key={item['@rid']} button dense onClick={() => handleExpand(item)}>
              <div className="nested-spacer" />
              <ListItemText className="detail-li-text">
                <div className="detail-identifiers-linkset">
                  <Typography color={opened.includes(item) ? 'secondary' : 'textSecondary'} variant="subtitle2">
                    {util.antiCamelCase(item['@class'])}
                  </Typography>
                  <Typography color={opened.includes(item) ? 'secondary' : 'textSecondary'} variant="subtitle2">
                    {schema.getPreview(item)}
                  </Typography>
                </div>
              </ListItemText>
              {!opened.includes(item) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </ListItem>
            <Collapse in={!!opened.includes(item)} unmountOnExit>
              {identifiers.map(propName => (
                <List dense disablePadding>
                  <ListItem>
                    <ListItemText>
                      <div className="detail-identifiers">
                        <Typography className="detail-identifiers-nested" variant="subtitle1">
                          {util.antiCamelCase(propName)}
                        </Typography>
                        <Typography>
                          {item[propName]}
                        </Typography>
                      </div>
                    </ListItemText>
                  </ListItem>
                </List>
              ))}
            </Collapse>
          </>
        ))}
        { type === 'embeddedset' && values.map(item => (
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

SetPropsList.propTypes = {
  handleExpand: PropTypes.func,
  identifiers: PropTypes.arrayOf(PropTypes.object),
  opened: PropTypes.arrayOf(PropTypes.string),
  prop: PropTypes.object,
  value: PropTypes.object,
};

SetPropsList.defaultProps = {
  handleExpand: () => {},
  identifiers: [],
  opened: [],
  prop: {},
  value: {},
};

export default SetPropsList;
