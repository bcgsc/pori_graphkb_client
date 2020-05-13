/**
 * @module /components/DetailDrawer/RelationshipDisplay
 */

import {
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from '@material-ui/core';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LinkIcon from '@material-ui/icons/Link';
import PropTypes from 'prop-types';
import React from 'react';

import schema from '@/services/schema';


/**
   * Formats record relationships.
   * @property {Object} record - Record being displayed.
   * @property {Object} linkOpen - edge record opened
   * @property {function} handleLinkExpand - adds link to opened list
   * @property {function} formatMetadata - formats metadata properties
   * @property {function} formatOtherProps - formats non-metadata properties
   */
function RelationshipList(props) {
  const {
    linkOpen, record, handleLinkExpand, formatMetadata, formatOtherProps,
  } = props;
  // Checks subclasses
  const edges = schema.getEdges(record);

  if (!edges || edges.length === 0) return null;
  return (
    <List>
      {edges.map((edge) => {
        const isOpen = linkOpen === edge['@rid'];
        let isIn = false;

        if (edge.in !== undefined) {
          isIn = edge.in && edge.in['@rid'] === record['@rid'];
        }
        const targetNode = isIn ? edge.out : edge.in;
        if (targetNode['@rid'] === record['@rid']) return null;
        let preview;

        try {
          preview = schema.getLabel(targetNode);
        } catch (e) {
          preview = 'Invalid variant';
        }
        return (
          <React.Fragment key={edge['@rid']}>
            <ListItem
              button
              className="detail-link-wrapper"
              dense
              onClick={() => handleLinkExpand(edge['@rid'])}
            >
              <ListItemIcon>
                <div style={{ display: 'inline-flex' }}>
                  <LinkIcon color="action" />
                </div>
              </ListItemIcon>
              <ListItemText
                className="detail-li-text"
                primary={<Typography variant="subtitle1">{preview}</Typography>}
                secondary={schema.get(edge['@class'])[isIn ? 'reverseName' : 'name']}
              />
              {!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </ListItem>
            <Collapse in={!!isOpen} unmountOnExit>
              <List
                className="detail-drawer__nested-list"
                dense
                disablePadding
              >
                <Divider />
                <ListSubheader color="primary" disableSticky>
                    Linked Record
                </ListSubheader>
                {formatOtherProps(isIn ? edge.out : edge.in, true)}
                {formatMetadata(isIn ? edge.out : edge.in, true)}
              </List>
              <Divider />
            </Collapse>
          </React.Fragment>
        );
      })}
    </List>
  );
}


RelationshipList.propTypes = {
  formatMetadata: PropTypes.func.isRequired,
  formatOtherProps: PropTypes.func.isRequired,
  handleLinkExpand: PropTypes.func.isRequired,
  linkOpen: PropTypes.object,
  record: PropTypes.object,
};

RelationshipList.defaultProps = {
  linkOpen: {},
  record: {},
};
export default RelationshipList;
