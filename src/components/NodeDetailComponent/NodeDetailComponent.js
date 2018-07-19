import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './NodeDetailComponent.css';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Card,
  Typography,
  CardContent,
  Divider,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  ListItemIcon,
} from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import SearchIcon from '@material-ui/icons/Search';
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
      filteredNode: null,
      nestedExpanded: [],
    };

    this.handleNestedToggle = this.handleNestedToggle.bind(this);
  }

  /**
   * Loads resources and filters node properties.
   */
  async componentDidMount() {
    const { node } = this.props;
    const V = await api.getVertexBaseClass();
    const ontologyEdges = await api.getOntologyEdges();

    const filteredNode = Object.assign({}, node);
    Object.keys(V.properties).forEach(key => delete filteredNode[key]);

    this.setState({
      V,
      ontologyEdges,
      filteredNode,
    });
  }

  handleNestedToggle(id) {
    const { nestedExpanded } = this.state;

    if (nestedExpanded.includes(id)) {
      const newList = nestedExpanded.filter(n => !n.startsWith(id));
      this.setState({ nestedExpanded: newList });
    } else {
      nestedExpanded.push(id);
      this.setState({ nestedExpanded });
    }
  }

  render() {
    const {
      V,
      ontologyEdges,
      filteredNode,
      nestedExpanded,
    } = this.state;

    const {
      handleNodeEditStart,
      node,
      children,
      handleNewQuery,
    } = this.props;

    // Accounts for in and out edgetypes.
    const expandedEdgeTypes = ontologyEdges ? ontologyEdges.reduce((r, e) => {
      r.push(`in_${e}`);
      r.push(`out_${e}`);
      return r;
    }, []) : [];

    if (!V) return null;

    /**
   * Formats node properties based on type.
   * @param {string} key - node property key.
   * @param {any} value - node property value.
   */
    const formatProperty = (key, value, prefix) => {
      const id = `${prefix ? `${prefix}.` : ''}${key}`;
      /* Checks if value is falsy, if it is an edge property, or if the depth
        of nested values is exceeded. (2) */
      if (
        !value
        || ontologyEdges.find(edge => edge === key.split('_')[1])
        || value.length === 0
        || (id.match(/\./g) || []).length > 2
      ) {
        return null;
      }
      const isOpen = nestedExpanded.includes(id);
      if (typeof value !== 'object') {
        return (
          <React.Fragment key={id}>
            <Typography variant="subheading">
              {`${util.antiCamelCase(key)}:`}
            </Typography>
            <Typography paragraph variant="caption">
              {value.toString()}
            </Typography>
          </React.Fragment>
        );
      }
      // TODO: handle case where field is array of objects that aren't edges.
      if (Array.isArray(value)) {
        if (value.length > 1 && !((id.match(/\./g) || []).length === 2)) {
          const preview = value.join(', ');
          const content = (
            <List style={{ paddingTop: '0' }}>
              {value.map(item => (

                <ListItem
                  dense
                  key={`${id}${item}`}
                  onClick={() => handleNewQuery(`subsets=${item}`)}
                >
                  <Link
                    to={`/data/table?subsets=${item}`}
                    className="icon-link"
                  >
                    <ListItemIcon>
                      <SearchIcon />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </Link>
                </ListItem>
              ))}
            </List>
          );
          return (
            <ExpansionPanel
              key={id}
              expanded={isOpen}
              onChange={() => this.handleNestedToggle(id)}
              className="nested-container"
            >
              <ExpansionPanelSummary expandIcon={<KeyboardArrowDownIcon />}>
                <Typography variant="subheading" style={{ flexBasis: '15%' }}>
                  {`${util.antiCamelCase(key)}:`}
                </Typography>
                {!isOpen
                  ? (
                    <Typography variant="subheading" color="textSecondary">
                      {preview}
                    </Typography>
                  ) : null}
              </ExpansionPanelSummary>
              <ExpansionPanelDetails style={{ display: 'block' }}>
                {content}
              </ExpansionPanelDetails>
            </ExpansionPanel>
          );
        }
        return (
          <React.Fragment key={id}>
            <Typography variant="subheading">
              {`${util.antiCamelCase(key)}:`}
            </Typography>
            <Typography paragraph variant="caption">
              {value[0].toString()}
              {((id.match(/\./g) || []).length === 2 && value.length > 1)
                ? (
                  <span>
                    <br />
                    . . .
                  </span>
                ) : null}
            </Typography>
          </React.Fragment>
        );
      }


      const nestedObject = Object.assign({}, value);
      Object.keys(V.properties).forEach(vk => delete nestedObject[vk]);
      const preview = util.getPreview(nestedObject);

      if ((id.match(/\./g) || []).length === 2) {
        return (
          <React.Fragment key={id}>
            <Typography variant="subheading">
              {`${util.antiCamelCase(key)}:`}
            </Typography>
            <Typography paragraph variant="caption">
              {preview}
            </Typography>
          </React.Fragment>
        );
      }

      return (
        <ExpansionPanel
          key={id}
          expanded={isOpen}
          onChange={() => this.handleNestedToggle(id)}
          className="nested-container"
        >
          <ExpansionPanelSummary expandIcon={<KeyboardArrowDownIcon />}>
            <Typography variant="subheading" style={{ flexBasis: '15%' }}>
              {`${util.antiCamelCase(key)}:`}
            </Typography>
            {!isOpen
              ? (
                <Typography variant="subheading" color="textSecondary">
                  {preview}
                </Typography>
              ) : null}
          </ExpansionPanelSummary>
          <ExpansionPanelDetails style={{ display: 'block' }}>
            {Object.keys(nestedObject).map(k => formatProperty(k, nestedObject[k], `${prefix ? `${prefix}.` : ''}${key}`))}
          </ExpansionPanelDetails>
        </ExpansionPanel>
      );
    };


    /**
     * Formats and lists relationship (edge) fields.
     */
    const listEdges = (key) => {
      const label = util.getEdgeLabel(key);
      const isOpen = nestedExpanded.includes(label);

      if (filteredNode[key] && filteredNode[key].length !== 0) {
        const preview = [];
        const content = (
          filteredNode[key].map((edge) => {
            const id = `${label}.${edge['@rid']}`;
            const relatedNode = edge.in && edge.in['@rid'] === node['@rid'] ? edge.out : edge.in;
            const edgeOpen = nestedExpanded.includes(id);
            preview.push(relatedNode.sourceId);
            return (
              <ExpansionPanel
                key={id}
                expanded={edgeOpen}
                onChange={() => this.handleNestedToggle(id)}
                className="nested-container"
              >
                <ExpansionPanelSummary
                  expandIcon={<KeyboardArrowDownIcon />}
                  classes={{ content: 'preview-content' }}
                >
                  <Typography
                    variant="subheading"
                    className="preview-title"
                  >
                    {`${relatedNode.sourceId}:`}
                  </Typography>
                  {!edgeOpen
                    ? (
                      <Typography
                        variant="subheading"
                        color="textSecondary"
                        className="preview"
                      >
                        {relatedNode.name || ''}
                      </Typography>
                    ) : null}
                  <div className="node-icon length-box">
                    <AssignmentIcon />
                  </div>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails style={{ display: 'block' }}>
                  {formatProperty('@class', relatedNode['@class'], id)}
                  {formatProperty('sourceId', relatedNode.sourceId, id)}
                  {formatProperty('name', relatedNode.name, id)}
                  {formatProperty('source', edge.source.name, id)}
                </ExpansionPanelDetails>
              </ExpansionPanel>
            );
          })
        );

        return (
          <ExpansionPanel
            key={label}
            expanded={isOpen}
            onChange={() => this.handleNestedToggle(label)}
            className="nested-container"
          >
            <ExpansionPanelSummary
              expandIcon={<KeyboardArrowDownIcon />}
              classes={{ content: 'preview-content' }}
            >
              <Typography
                variant="subheading"
                className="preview-title"
              >
                {`${label}:`}
              </Typography>
              {!isOpen
                ? (
                  <React.Fragment>
                    <Typography
                      variant="subheading"
                      color="textSecondary"
                      className="preview"
                    >
                      {preview.join(', ')}
                    </Typography>
                    <div className="length-box">
                      <Typography
                        variant="subheading"
                      >
                        {filteredNode[key].length}
                      </Typography>
                    </div>
                  </React.Fragment>
                ) : null}
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{ display: 'block' }}>
              {content}
            </ExpansionPanelDetails>
          </ExpansionPanel>
        );
      } return null;
    };

    return (
      <Card style={{ height: '100%', overflowY: 'auto' }}>
        <div className="node-edit-btn">
          <IconButton
            onClick={() => handleNodeEditStart(node)}
          >
            <AssignmentIcon />
          </IconButton>
          {children}
        </div>
        <div className="node-properties">
          <Card className="basic-properties">
            <CardContent>
              <Typography paragraph variant="title" component="h1">
                Properties:
                <Divider />
              </Typography>
              {Object.keys(filteredNode).map(key => formatProperty(key, filteredNode[key], ''))}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography paragraph variant="title" component="h1">
                Relationships:
                <Divider />
              </Typography>
              {expandedEdgeTypes.map(edgeType => listEdges(edgeType))}
            </CardContent>
          </Card>
        </div>
      </Card>
    );
  }
}

NodeDetailComponent.defaultProps = {
  node: null,
  children: null,
  handleNewQuery: null,
};

NodeDetailComponent.propTypes = {
  node: PropTypes.object,
  handleNodeEditStart: PropTypes.func.isRequired,
  handleNewQuery: PropTypes.func,
  children: PropTypes.node,
};

export default NodeDetailComponent;
