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
    const ontologyEdges = util.getEdges(schema);
    // Accounts for in and out edgetypes.
    const expandedEdgeTypes = ontologyEdges ? ontologyEdges.reduce((r, e) => {
      r.push(`in_${e}`);
      r.push(`out_${e}`);
      return r;
    }, []) : [];
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
      handleNewQuery,
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
      /* Checks if value is falsy, if it is an edge property, or if the depth
        of nested values is exceeded. (2) */
      if (
        !value
        || expandedEdgeTypes.find(edge => edge === key)
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
            <Typography paragraph variant="body1" color="textSecondary">
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
                  className="list-icon"
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
                    ? (
                      <Typography
                        variant="subheading"
                        color="textSecondary"
                        className="preview"
                      >
                        {preview}
                      </Typography>
                    ) : null}
                </div>
                {!isOpen
                  ? (
                    <div className="length-box">
                      <Typography
                        variant="subheading"
                      >
                        {value.length}
                      </Typography>
                    </div>) : null}
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
              {((id.match(/\./g) || []).length === 2 && value.length > 1)
                ? (
                  <span>
                    <br />
                    . . .
                  </span>
                ) : null}
              {value[0].toString()}
            </Typography>
          </React.Fragment>
        );
      }

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
              ? (
                <Typography
                  variant="subheading"
                  color="textSecondary"
                  className="preview"
                >
                  {preview}
                </Typography>
              ) : null}
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
    const listEdges = (key) => {
      const label = util.getEdgeLabel(key);
      const isOpen = nestedExpanded.includes(label);
      if (filteredNode[key] && filteredNode[key].length !== 0) {
        const preview = [];
        const content = filteredNode[key].reduce((r, edge) => {
          const id = `${label}.${edge['@rid']}`;
          const relatedNode = edge.in && edge.in['@rid'] === node['@rid'] ? edge.out : edge.in;
          if (relatedNode['@class'] !== 'Statement') {
            const edgeOpen = nestedExpanded.includes(id);
            preview.push(util.getPreview(relatedNode));
            r.push((
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
                    ? formatProperty('source', edge.source.name, id)
                    : null}
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

    const relationships = expandedEdgeTypes.reduce((r, e) => {
      const rendered = listEdges(e);
      if (rendered) r.push(rendered);
      return r;
    }, []);

    const className = variant === 'table' ? 'detail-table' : 'detail-graph';

    return (
      <Card style={{ height: '100%', overflowY: 'auto' }}>
        <div className="node-edit-btn">
          {children}
          <IconButton
            onClick={() => handleNodeEditStart(node['@rid'], node['@class'])}
          >
            <EditIcon />
          </IconButton>
        </div>
        <div className={`node-properties ${className}`}>
          <Card className="properties">
            <CardContent>
              <Typography paragraph variant="title" component="h1">
                Properties:
                <Divider />
              </Typography>
              {Object.keys(filteredNode).map(key => formatProperty(key, filteredNode[key], ''))}
            </CardContent>
          </Card>
          <Card className="properties">
            <CardContent>
              <Typography paragraph variant="title" component="h1">
                Relationships:
                <Divider />
              </Typography>
              {relationships.length !== 0 ? relationships : (
                <Typography variant="caption" style={{ margin: 'auto' }}>No relationships</Typography>
              )}
            </CardContent>
          </Card>
        </div>
      </Card>
    );
  }
}

NodeDetailComponent.propTypes = {
  node: PropTypes.object,
  handleNodeEditStart: PropTypes.func.isRequired,
  handleNewQuery: PropTypes.func.isRequired,
  children: PropTypes.node,
  variant: PropTypes.string,
};

NodeDetailComponent.defaultProps = {
  node: null,
  children: null,
  variant: 'table',
};

export default NodeDetailComponent;
