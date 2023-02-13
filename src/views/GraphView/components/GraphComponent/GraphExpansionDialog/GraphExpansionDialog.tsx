import './GraphExpansionDialog.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  Button,
  ButtonProps,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import React from 'react';

import { GeneralRecordType } from '@/components/types';
import schema from '@/services/schema';

import { GraphLink } from '../kbgraph';

interface GraphExpansionDialogProps {
  /** handler for user clicking away or cancelling. */
  onClose: (...args: unknown[]) => void;
  /** handler for confirming expansion. */
  onExpand: ButtonProps['onClick'];
  /** toggles staged/unstaged state for a single
 * edge. */
  onStage: (rid: string) => void;
  /** toggles selecting all/none of staged
 * edges. */
  onStageAll: (e: unknown) => void;
  /** toggles staged/unstaged state for edges
 * of a single class. */
  onStageClass: (edgeClass: string | undefined) => ButtonProps['onClick'];
  /** Dialog open state */
  open: boolean;
  /** list of edge RID's that will be excluded in node expansion. (unstaged) */
  expandExclusions?: string[];
  /** list of all currently rendered graph links. */
  links?: GraphLink[];
  /** Graph node staged for expansion. */
  node?: GeneralRecordType | null;
}

/**
 * Dialog opened when a user attempts to open a heavily connected node.
 */
function GraphExpansionDialog(props: GraphExpansionDialogProps) {
  const {
    node,
    open,
    onClose,
    links = [],
    expandExclusions = [],
    onExpand,
    onStageAll,
    onStage,
    onStageClass,
  } = props;

  if (!node) {
    return null;
  }
  const edges = schema.getEdges(node);
  return (
    <Dialog
      classes={{
        root: 'expansion-root',
        paper: 'expansion-dialog',
      }}
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
    >
      <DialogTitle>Select Edges to Expand</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1">
          Expand by Edge Types:
        </Typography>
        <List className="expand-links-types" dense>
          {(edges || []).reduce((array: (string | undefined)[], edge) => {
            if (
              !array.includes(edge['@class'])
              && !links.find((l) => l.getId() === edge['@rid'])
            ) {
              array.push(edge['@class']);
            }
            return array;
          }, []).map((edge) => (
            <ListItem
              key={edge}
              className="expand-links-type"
            >
              <Button
                color="secondary"
                onClick={onStageClass(edge)}
                variant="outlined"
              >
                {edge}
              </Button>
            </ListItem>
          ))}
        </List>
        <Typography variant="subtitle1">
          Select Individual Links:
        </Typography>
        <ListItem
          button
          className="expand-links-link"
          onClick={onStageAll}
        >
          <Checkbox checked={!(expandExclusions.length === edges.length)} />
          <ListItemText>
            <Typography variant="subtitle1">
              {expandExclusions.length === edges.length
                ? 'Select All' : 'Deselect All'}
            </Typography>
          </ListItemText>
        </ListItem>
        <Divider />
        <List className="expand-links-list" dense>
          {edges.map((edge) => {
            const inRid = edge.in['@rid'];
            const target = inRid === node['@rid'] ? edge.out : edge.in;

            if (target['@rid'] === node['@rid']
              || links.find((l) => l.getId() === edge['@rid'])) {
              return null;
            }
            const classLabel = schemaDefn.get(edge['@class'])[inRid === node['@rid'] ? 'reverseName' : 'name'];
            return (
              <ListItem
                key={edge['@rid']}
                button
                className="expand-links-link"
                onClick={() => onStage(edge['@rid'])}
              >
                <Checkbox checked={!expandExclusions.includes(edge['@rid'])} />
                <ListItemText>
                  <Typography variant="body1">{schemaDefn.getPreview(target)}</Typography>
                  <Typography variant="caption">{classLabel}</Typography>
                </ListItemText>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          id="expand-dialog-submit"
          onClick={onExpand}
        >
          Expand
        </Button>
      </DialogActions>
    </Dialog>
  );
}

GraphExpansionDialog.defaultProps = {
  node: null,
  links: [],
  expandExclusions: [],
};

export default GraphExpansionDialog;
