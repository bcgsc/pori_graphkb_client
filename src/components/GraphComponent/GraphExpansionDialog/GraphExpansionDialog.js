import React from 'react';
import PropTypes from 'prop-types';
import './GraphExpansionDialog.css';
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
import util from '../../../services/util';

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
    onExpandAll,
    onExpandExclusion,
    onExpandByClass,
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
                onClick={onExpandByClass(edge)}
              >
                {util.getEdgeLabel(edge)}
              </Button>
            </ListItem>
          ))}
        </List>
        <Typography variant="subtitle1">
          Select Individual Links:
        </Typography>
        <ListItem
          button
          onClick={onExpandAll}
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
            return (
              <ListItem
                key={edge['@rid']}
                button
                onClick={() => onExpandExclusion(edge['@rid'])}
                className="expand-links-link"
              >
                <Checkbox checked={!expandExclusions.includes(edge['@rid'])} />
                <ListItemText>
                  <Typography variant="body1">{target.name}</Typography>
                  <Typography>{target.sourceId}</Typography>
                  <Typography variant="caption">{target.source.name || node.source.name}</Typography>
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

GraphExpansionDialog.propTypes = {
  schema: PropTypes.object.isRequired,
  node: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  links: PropTypes.array,
  expandExclusions: PropTypes.array,
  onExpand: PropTypes.func.isRequired,
  onExpandAll: PropTypes.func.isRequired,
  onExpandExclusion: PropTypes.func.isRequired,
  onExpandByClass: PropTypes.func.isRequired,
};

GraphExpansionDialog.defaultProps = {
  node: null,
  links: [],
  expandExclusions: [],
};

export default GraphExpansionDialog;
