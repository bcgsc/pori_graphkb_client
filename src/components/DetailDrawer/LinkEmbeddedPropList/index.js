
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

import RecordIdLink from '@/components/RecordIdLink';
import schema from '@/services/schema';
import util from '@/services/util';

/**
   * Renders formatted link/embedded props.
   *
   * @property {PropertyModel} prop link/embedded property model
   * @property {bool} isNested is the prop nested
   * @property {Arrayof<Objects>}  value contains link/embedded records
   * @property {Arrayof<string>} opened opened dropdowns in drawer
   * @property {Arrayof<string>} identifiers props to be displayed for submenu
   * @property {function} formatOtherProps property formatting function
   * @property {function} handleExpand adds prop to opened object and handles expansion
   */
function LinkEmbeddedPropList(props) {
  const {
    prop, isNested, value, identifiers, handleExpand, formatOtherProps, opened,
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

LinkEmbeddedPropList.propTypes = {
  formatOtherProps: PropTypes.func.isRequired,
  handleExpand: PropTypes.func,
  identifiers: PropTypes.arrayOf(PropTypes.object),
  isNested: PropTypes.bool,
  opened: PropTypes.arrayOf(PropTypes.string),
  prop: PropTypes.object,
  value: PropTypes.object,
};

LinkEmbeddedPropList.defaultProps = {
  handleExpand: () => {},
  identifiers: [],
  isNested: false,
  opened: [],
  prop: {},
  value: {},
};

export default LinkEmbeddedPropList;
