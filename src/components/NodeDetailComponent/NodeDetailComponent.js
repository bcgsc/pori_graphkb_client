import React, { Component } from 'react';
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
import api from '../../services/api';
import util from '../../services/util';

/**
 * Component to view details of a selected node.
 * @param {Object} props - Component properties passed in by parent.
 * @param {Object} props.node - Node object selected for detail.
 */
class NodeDetailComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      V: null,
      ontologyEdges: null,
    };
  }

  async componentDidMount() {
    const { node } = this.props;
    const V = await api.getVertexBaseClass();
    const ontologyEdges = await api.getOntologyEdges();
    const filteredNode = node;
    Object.keys(V.properties).forEach(key => delete filteredNode[key]);
    console.log(Object.keys(node));

    this.setState({ V, ontologyEdges, node: filteredNode });
  }

  render() {
    const { V, ontologyEdges, node } = this.state;
    const { handleNodeEditStart } = this.props;

    const expandedEdgeTypes = ontologyEdges ? ontologyEdges.reduce((r, e) => {
      r.push({ name: `in_${e.name}` });
      r.push({ name: `out_${e.name}` });
      return r;
    }, []) : [];

    if (!V) return null;

    const listEdges = (key) => {
      // Format string:  in_[edgeType] => has[edgeType]
      //                 out_[edgeType] => [edgeType]
      const edgeType = key.split('_')[1];
      const label = key.startsWith('in_')
        ? `has${edgeType.slice(0, edgeType.length - 2)}`
        : edgeType;
      if (node[key] && node[key].length !== 0) {
        return (
          <React.Fragment key={label}>
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

    const formatProperty = (key, value) => {
      if (
        !value
        || ontologyEdges.filter(o => o.name === key.split('_')[1]).length !== 0
        || value.length === 0
      ) {
        return null;
      }

      if (typeof value !== 'object') {
        return (
          <React.Fragment key={`${key}${value}`}>
            <Typography variant="subheading">
              {`${util.antiCamelCase(key)}:`}
            </Typography>
            <Typography paragraph variant="caption">
              {value.toString()}
            </Typography>
          </React.Fragment>
        );
      }
      if (Array.isArray(value)) {
        return (
          <React.Fragment key={util.antiCamelCase(key)}>
            <Typography variant="subheading">
              {`${util.antiCamelCase(key)}:`}
            </Typography>
            <List>
              {value.map(item => (
                <ListItem dense key={`${value}${item}`}>
                  <ListItemText secondary={item} />
                </ListItem>
              ))}
            </List>
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={util.antiCamelCase(key)}>
          <Typography variant="subheading">
            {`${util.antiCamelCase(key)}:`}
          </Typography>
          <Typography paragraph variant="caption">
            {value.name}
          </Typography>
        </React.Fragment>
      );
    };

    return (
      <Card style={{ height: '100%', overflowY: 'auto' }}>
        <div className="node-edit-btn">
          <IconButton
            onClick={() => handleNodeEditStart(node['@rid'])}
          >
            <AssignmentIcon />
          </IconButton>
        </div>
        <div className="node-properties">
          <section className="basic-properties">
            {Object.keys(node).map(key => formatProperty(key, node[key]))}
          </section>
          <section className="listed-properties">
            {expandedEdgeTypes.map(edgeType => listEdges(edgeType.name))}
          </section>
        </div>
      </Card>
    );
  }
}

NodeDetailComponent.defaultProps = {
  node: null,
};

NodeDetailComponent.propTypes = {
  node: PropTypes.object,
  handleNodeEditStart: PropTypes.func.isRequired,
};

export default NodeDetailComponent;
