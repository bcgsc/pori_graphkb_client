import React from 'react';
import PropTypes from 'prop-types';
import './GraphExpansionDialog.scss';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  DialogActions,
  Divider,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';

/**
 * Dialog opened when a user attempts to open a heavily connected node.
 */
function GraphExpansionDialog(props) {
  const {
    schema,
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
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      classes={{
        root: 'expansion-root',
        paper: 'expansion-dialog',
      }}
    >
      <DialogTitle>Select Edges to Expand</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1">
          Expand by Edge Types:
        </Typography>
        <List dense className="expand-links-types">
          {(edges || []).reduce((array, edge) => {
            if (
              !array.includes(edge['@class'])
              && !links.find(l => l.getId() === edge['@rid'])
            ) {
              array.push(edge['@class']);
            }
            return array;
          }, []).map(edge => (
            <ListItem
              key={edge}
              className="expand-links-type"
            >
              <Button
                variant="outlined"
                color="secondary"
                onClick={onStageClass(edge)}
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
          onClick={onStageAll}
          className="expand-links-link"
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
        <List dense className="expand-links-list">
          {edges.map((edge) => {
            const inRid = edge.in['@rid'];
            const target = inRid === node['@rid'] ? edge.out : edge.in;
            if (target['@rid'] === node['@rid']
              || links.find(l => l.getId() === edge['@rid'])) {
              return null;
            }
            const classLabel = schema.get(edge['@class'])[inRid === node['@rid'] ? 'reverseName' : 'name'];
            return (
              <ListItem
                key={edge['@rid']}
                button
                onClick={() => onStage(edge['@rid'])}
                className="expand-links-link"
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
          onClick={onExpand}
          id="expand-dialog-submit"
        >
          Expand
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * @namespace
 * @property {Object} schema - KB Schema object.
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
  schema: PropTypes.object.isRequired,
  node: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  links: PropTypes.array,
  expandExclusions: PropTypes.arrayOf(PropTypes.string),
  onExpand: PropTypes.func.isRequired,
  onStageAll: PropTypes.func.isRequired,
  onStage: PropTypes.func.isRequired,
  onStageClass: PropTypes.func.isRequired,
};

GraphExpansionDialog.defaultProps = {
  node: null,
  links: [],
  expandExclusions: [],
};

export default GraphExpansionDialog;
