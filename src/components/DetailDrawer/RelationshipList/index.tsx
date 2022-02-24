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
import React from 'react';

import schema from '@/services/schema';

interface RelationshipListProps {
  /** formats metadata properties */
  formatMetadata(...args: unknown[]): unknown;
  /** formats non-metadata properties */
  formatOtherProps(...args: unknown[]): unknown;
  /** adds link to opened list */
  handleLinkExpand(...args: unknown[]): unknown;
  /** edge record opened */
  linkOpen?: object;
  /** Record being displayed. */
  record?: object;
}

/**
   * Formats record relationships.
   */
function RelationshipList(props: RelationshipListProps) {
  const {
    linkOpen, record = {}, handleLinkExpand, formatMetadata, formatOtherProps,
  } = props;
  // Checks subclasses
  const edges = schema.getEdges(record);

  const rid = (rec) => rec['@rid'] || rec;

  if (!edges || edges.length === 0) return null;
  return (
    <List>
      {edges.map((edge) => {
        const isOpen = linkOpen === rid(edge);
        let isIn = false;

        if (edge.in !== undefined) {
          isIn = edge.in && rid(edge.in) === rid(record);
        }
        const targetNode = isIn ? edge.out : edge.in;

        if (rid(targetNode) === rid(record)) {
          return null;
        }
        let preview;

        try {
          preview = schema.getLabel(targetNode);
        } catch (e) {
          preview = 'Invalid variant';
        }
        return (
          <React.Fragment key={rid(edge)}>
            <ListItem
              button
              className="detail-link-wrapper"
              dense
              onClick={() => handleLinkExpand(rid(edge))}
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

RelationshipList.defaultProps = {
  linkOpen: {},
  record: {},
};
export default RelationshipList;
