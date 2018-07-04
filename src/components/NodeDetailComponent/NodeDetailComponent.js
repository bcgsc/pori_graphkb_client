import React from 'react';
import PropTypes from 'prop-types';
import './NodeDetailComponent.css';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Card,
  Typography,
} from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';

function NodeDetailComponent(props) {
  const { node, handleNodeEditStart } = props;

  const listEdges = (key) => {
    // Format string:  in_[edgeType] => has[edgeType]
    //                 out_[edgeType] => [edgeType]
    const edgeType = key.split('_')[1];
    const label = key.startsWith('in_')
      ? `has${edgeType.slice(0, edgeType.length - 2)}`
      : edgeType;
    if (node[key] && node[key].length !== 0) {
      return (
        <React.Fragment>
          <Typography variant="subheading">
            {`${label}:`}
          </Typography>
          <List>
            {node[key].map((edge) => {
              const relatedNode = edge.in && edge.in['@rid'] === node['@rid'] ? edge.out : edge.in;
              return (
                <ListItem dense key={key + edge['@rid']}>
                  <ListItemText
                    secondary={
                      relatedNode
                        ? `${relatedNode.name} | ${relatedNode.sourceId} : ${edge.source.name}`
                        : edge
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </React.Fragment>
      );
    } return null;
  };

  const subsets = node.subsets && node.subsets.length !== 0 ? (
    <React.Fragment>
      <Typography variant="subheading">
        Subsets:
      </Typography>
      <List>
        {node.subsets.map(subset => (
          <ListItem dense key={`subset${subset}`}>
            <ListItemText secondary={subset} />
          </ListItem>
        ))}
      </List>
    </React.Fragment>
  ) : null;

  return (
    <Card className="node-wrapper">
      <div className="node-edit-btn">
        <IconButton
          onClick={() => handleNodeEditStart(node['@rid'])}
        >
          <AssignmentIcon />
        </IconButton>
      </div>
      <div className="node-properties">
        <section className="basic-properties">
          <Typography variant="subheading">
            Class:
          </Typography>
          <Typography paragraph variant="caption">
            {node['@class']}
          </Typography>
          <Typography variant="subheading">
            Source:
          </Typography>
          <Typography paragraph variant="caption">
            {node.source.name || 'none'}
          </Typography>
          <Typography variant="subheading">
            Source ID:
          </Typography>
          <Typography paragraph variant="caption">
            {node.sourceId || 'none'}
          </Typography>
          <Typography variant="subheading">
            Name:
          </Typography>
          <Typography paragraph variant="caption">
            {node.name || 'none'}
          </Typography>
          {node.description
            ? (
              <div>
                <Typography variant="subheading">
                  Description:
                </Typography>
                <Typography paragraph variant="caption">
                  {node.description || 'none'}
                </Typography>
              </div>
            ) : null
          }
          {node.longName
            ? (
              <div>
                <Typography variant="subheading">
                  Long Name:
                </Typography>
                <Typography paragraph variant="caption">
                  {node.longName || 'none'}
                </Typography>
              </div>
            ) : null
          }
          {subsets}
        </section>
        <section className="listed-properties">
          {listEdges('out_AliasOf')}
          {listEdges('in_AliasOf')}
          {listEdges('out_SubClassOf')}
          {listEdges('in_SubClassOf')}
        </section>
      </div>
    </Card>
  );
}

NodeDetailComponent.defaultProps = {
  node: null,
};

NodeDetailComponent.propTypes = {
  node: PropTypes.object,
  handleNodeEditStart: PropTypes.func.isRequired,
};

export default NodeDetailComponent;
