import './GraphExpansionDialog.scss';

import {
  Button,
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
import PropTypes from 'prop-types';
import React from 'react';

import schema from '@/services/schema';

/**
 * Dialog opened when a user attempts to open a heavily connected node.
 */
function GraphExpansionDialog(props) {
  const {
    node,
    open,
    onClose,
    links,
    expandExclusions,
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
          {(edges || []).reduce((array, edge) => {
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
            const classLabel = schema.get(edge['@class'])[inRid === node['@rid'] ? 'reverseName' : 'name'];
            return (
              <ListItem
                key={edge['@rid']}
                button
                className="expand-links-link"
                onClick={() => onStage(edge['@rid'])}
              >
                <Checkbox checked={!expandExclusions.includes(edge['@rid'])} />
                <ListItemText>
                  <Typography variant="body1">{schema.getPreview(target)}</Typography>
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

/**
 * @namespace
 * @property {Object} node - Graph node staged for expansion.
 * @property {boolean} open - Dialog open state
 * @property {function} onClose - handler for user clicking away or cancelling.
 * @property {Array.<Object>} links - list of all currently rendered graph
 * links.
 * @property {Array.<string>} expandExclusions - list of edge RID's that will be
 * excluded in node expansion. (unstaged)
 * @property {function} onExpand - handler for confirming expansion.
 * @property {function} onStageAll - toggles selecting all/none of staged
 * edges.
 * @property {function} onStage - toggles staged/unstaged state for a single
 * edge.
 * @property {function} onStageClass - toggles staged/unstaged state for edges
 * of a single class.
 */
GraphExpansionDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired,
  onStage: PropTypes.func.isRequired,
  onStageAll: PropTypes.func.isRequired,
  onStageClass: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  expandExclusions: PropTypes.arrayOf(PropTypes.string),
  links: PropTypes.array,
  node: PropTypes.object,
};

GraphExpansionDialog.defaultProps = {
  node: null,
  links: [],
  expandExclusions: [],
};

export default GraphExpansionDialog;
