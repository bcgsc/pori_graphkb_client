import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import {
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from '@mui/material';
import React from 'react';

import { GeneralRecordType } from '@/components/types';
import schema from '@/services/schema';

interface RelationshipListProps {
  /** formats metadata properties */
  formatMetadata: (arg: unknown, arg2: boolean) => void;
  /** formats non-metadata properties */
  formatOtherProps: (arg: unknown, arg2: boolean) => void;
  /** adds link to opened list */
  handleLinkExpand: (rid: string) => void;
  /** edge record opened */
  linkOpen?: string | null;
  /** Record being displayed. */
  record?: GeneralRecordType
}

/**
 * Formats record relationships.
 */
function RelationshipList(props: RelationshipListProps) {
  const {
    linkOpen = {}, record = {}, handleLinkExpand, formatMetadata, formatOtherProps,
  } = props;
  // Checks subclasses
  const edges = schema.getEdges(record ?? null);

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

        if (targetNode === undefined || rid(targetNode) === rid(record)) {
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
                secondary={schemaDefn.get(edge['@class'])[isIn ? 'reverseName' : 'name']}
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

export default RelationshipList;
