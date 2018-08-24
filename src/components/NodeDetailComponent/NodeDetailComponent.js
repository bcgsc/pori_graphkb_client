/**
 * @module /components/NodeDetailComponent
 */

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
  CardContent,
  Divider,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  ListItemIcon,
  Tooltip,
} from '@material-ui/core';
import BookmarkIcon from '@material-ui/icons/Bookmark';
import EditIcon from '@material-ui/icons/Edit';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import SearchIcon from '@material-ui/icons/Search';
import api from '../../services/api';
import util from '../../services/util';

const MAX_NESTED_DEPTH = 2;

/**
 * Component to view details of a selected node. Can be adapted to display in
 * both the table view and the graph view.
 */
class NodeDetailComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      V: null,
      nestedExpanded: [],
      expandedEdgeTypes: [],
    };

    this.handleNestedToggle = this.handleNestedToggle.bind(this);
  }

  /**
   * Loads resources and filters node properties.
   */
  async componentDidMount() {
    const schema = await api.getSchema();
    const { V } = schema;
    // Accounts for in and out edgetypes.
    const expandedEdgeTypes = util.expandEdges(api.getEdges(schema));
    this.setState({
      V,
      expandedEdgeTypes,
    });
  }

  /**
   * Toggles the open/closed state of a nested object drawer.
   * @param {string} id - id of nested object.
   */
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
      expandedEdgeTypes,
      nestedExpanded,
    } = this.state;

    const {
      handleNodeEditStart,
      node,
      children,
      variant,
      detailEdge,
    } = this.props;

    if (!V) return null;
    const filteredNode = Object.assign({}, node);
    Object.keys(V.properties).forEach((key) => { if (key !== '@class') delete filteredNode[key]; });

    /**
     * Formats node properties based on type.
     * @param {string} key - node property key.
     * @param {any} value - node property value.
     */
    const formatProperty = (key, value, prefix) => {
      const id = `${prefix ? `${prefix}.` : ''}${key}`;
      /**
       * Checks if value is falsy, if it is an edge property, or if the depth
       * of nested values is exceeded (2).
       */
      if (
        !value
        || expandedEdgeTypes.find(edge => edge === key)
        || value.length === 0
        || (id.match(/\./g) || []).length > MAX_NESTED_DEPTH
      ) {
        return null;
      }


      /*  PRIMITIVE PROPERTY  */
      if (typeof value !== 'object') {
        return (
          <React.Fragment key={id}>
            <Typography variant="subheading">
              {`${util.antiCamelCase(key)}:`}
            </Typography>
            <Typography paragraph variant="body1" color="textSecondary">
              {value.toString()}
            </Typography>
          </React.Fragment>
        );
      }

      const isOpen = nestedExpanded.includes(id);


      // TODO: handle case where field is array of objects that aren't edges.
      /*  ARRAY PROPERTY   */
      if (Array.isArray(value)) {
        if (!((id.match(/\./g) || []).length === MAX_NESTED_DEPTH)) {
          const preview = value.join(', ');
          const content = (
            <List style={{ paddingTop: '0' }}>
              {value.map(item => (
                <ListItem
                  dense
                  key={`${id}${item}`}
                >
                  <ListItemIcon>
                    <SearchIcon />
                  </ListItemIcon>
                  <ListItemText primary={item} />
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
              <ExpansionPanelSummary
                expandIcon={<KeyboardArrowDownIcon />}
                classes={{ content: 'preview-content' }}
              >
                <div className="preview-wrap">
                  <Typography
                    variant="subheading"
                    className="preview-title"
                  >
                    {`${util.antiCamelCase(key)}:`}
                  </Typography>
                  {!isOpen
                    && (
                      <Typography
                        variant="subheading"
                        color="textSecondary"
                        className="preview"
                      >
                        {preview}
                      </Typography>
                    )}
                </div>
                {!isOpen
                  && (
                    <div className="length-box">
                      <Typography
                        variant="subheading"
                      >
                        {value.length}
                      </Typography>
                    </div>)}
              </ExpansionPanelSummary>
              <ExpansionPanelDetails style={{ display: 'block' }}>
                {content}
              </ExpansionPanelDetails>
            </ExpansionPanel>
          );
        }
      }


      /*  OBJECT PROPERTY   */
      const nestedObject = Object.assign({}, value);
      Object.keys(V.properties).forEach((vk) => {
        if (vk !== '@class') delete nestedObject[vk];
      });
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
          <ExpansionPanelSummary
            expandIcon={<KeyboardArrowDownIcon />}
            classes={{ content: 'preview-content' }}
          >
            <Typography
              variant="subheading"
              className="preview-title"
            >
              {`${util.antiCamelCase(key)}:`}
            </Typography>
            {!isOpen
              && (
                <Typography
                  variant="subheading"
                  color="textSecondary"
                  className="preview"
                >
                  {preview}
                </Typography>
              )}
            <Tooltip title="This refers to another database record">
              <div className="node-icon length-box">
                <BookmarkIcon />
              </div>
            </Tooltip>
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
    const listEdge = (key) => {
      const label = util.getEdgeLabel(key);
      const isOpen = nestedExpanded.includes(label);
      if (filteredNode[key] && filteredNode[key].length !== 0) {
        const previews = [];
        const content = filteredNode[key].reduce((r, edge) => {
          const id = `${label}.${edge['@rid']}`;
          const relatedNode = edge.in && edge.in['@rid'] === node['@rid'] ? edge.out : edge.in;
          if (relatedNode['@class'] !== 'Statement') { // Statement flag
            const edgeOpen = nestedExpanded.includes(id);
            previews.push(util.getPreview(relatedNode));
            r.push((
              <ExpansionPanel
                key={id}
                expanded={edgeOpen}
                onChange={() => this.handleNestedToggle(id)}
                className="nested-container detail-edge"
              >
                <ExpansionPanelSummary
                  expandIcon={<KeyboardArrowDownIcon />}
                  classes={{ content: 'preview-content' }}
                >
                  <div className="preview-wrap">
                    <Typography
                      variant="subheading"
                      className="preview-title"
                    >
                      {util.getPreview(relatedNode)}
                    </Typography>
                  </div>
                  <Tooltip title="This refers to another database record">
                    <div className="node-icon length-box">
                      <BookmarkIcon />
                    </div>
                  </Tooltip>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails style={{ display: 'block' }}>
                  {formatProperty('@class', relatedNode['@class'], id)}
                  {formatProperty('sourceId', relatedNode.sourceId, id)}
                  {formatProperty('name', relatedNode.name, id)}
                  {edge.source && edge.source.name
                    && formatProperty('source', edge.source.name, id)}
                </ExpansionPanelDetails>
              </ExpansionPanel>
            ));
          }
          return r;
        }, []);
        if (content.length === 0) return null;
        return (
          <ExpansionPanel
            key={label}
            expanded={isOpen}
            onChange={() => this.handleNestedToggle(label)}
            className="nested-container"
            id={label}
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
              {!isOpen && (
                <React.Fragment>
                  <Typography
                    variant="subheading"
                    color="textSecondary"
                    className="preview"
                  >
                    {previews.join(', ')}
                  </Typography>
                  <div className="length-box">
                    <Typography
                      variant="subheading"
                    >
                      {filteredNode[key].length}
                    </Typography>
                  </div>
                </React.Fragment>
              )}
            </ExpansionPanelSummary>
            <ExpansionPanelDetails style={{ display: 'block' }}>
              {content}
            </ExpansionPanelDetails>
          </ExpansionPanel>
        );
      } return null;
    };

    const relationships = expandedEdgeTypes.reduce((r, e) => {
      const rendered = listEdge(e);
      if (rendered) r.push(rendered);
      return r;
    }, []);

    const className = variant === 'table' ? 'detail-table' : 'detail-graph';

    return (
      <Card style={{ height: '100%', overflowY: 'auto' }}>
        <div className="node-edit-btn">
          {children}
          {!detailEdge ? (
            <IconButton
              onClick={() => handleNodeEditStart(node['@rid'], node['@class'])}
            >
              <EditIcon />
            </IconButton>
          ) : null}
        </div>
        <div className={`node-properties ${className}`}>
          <Card className="properties">
            <CardContent>
              <Typography paragraph variant="title" component="h1">
                Properties:
                <Divider />
              </Typography>
              {Object.keys(filteredNode)
                .map(key => formatProperty(key, filteredNode[key], ''))}
            </CardContent>
          </Card>
          {(variant !== 'graph' || relationships.length !== 0) && (
            <Card className="properties">
              <CardContent>
                <Typography paragraph variant="title" component="h1">
                  Relationships:
                  <Divider />
                </Typography>
                {relationships.length !== 0 ? relationships : (
                  <Typography variant="caption" style={{ margin: 'auto' }}>
                    No relationships
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </Card>
    );
  }
}

NodeDetailComponent.propTypes = {
  /**
   * @param {Object} node - node to be displayed.
   */
  node: PropTypes.object,
  /**
   * @param {function} handleNodeEditStart - function to handle request to edit
   * selected node
   */
  handleNodeEditStart: PropTypes.func,
  /**
   * @param {Node} children - Additional buttons to render in the sidebar of
   * the component.
   */
  children: PropTypes.node,
  /**
   * @param {string} variant - variant indicator for component.
   */
  variant: PropTypes.string,
  /**
   * @param {boolean} detailEdge - specifies if node is an edge.
   */
  detailEdge: PropTypes.bool,
};

NodeDetailComponent.defaultProps = {
  node: null,
  children: null,
  variant: 'table',
  detailEdge: false,
  handleNodeEditStart: null,
};

export default NodeDetailComponent;
