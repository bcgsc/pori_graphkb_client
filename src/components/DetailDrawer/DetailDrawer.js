/**
 * @module /components/OntologyDetailComponent
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './DetailDrawer.css';
import {
  Typography,
  IconButton,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
  ListSubheader,
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import LinkIcon from '@material-ui/icons/Link';
import util from '../../services/util';
import classes from '../../models/classes';

const MAX_STRING_LENGTH = 64;

class DetailDrawer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: [],
      linkOpen: null,
    };
    this.formatOtherProps = this.formatOtherProps.bind(this);
    this.formatRelationships = this.formatRelationships.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
    this.handleLinkExpand = this.handleLinkExpand.bind(this);
  }

  /**
   * Closes all expanded list properties.
   * @param {Object} prevProps - Component's previous props.
   */
  componentDidUpdate(prevProps) {
    const { node: prevNode } = prevProps;
    const { node } = this.props;
    if (
      (!node && prevNode)
      || (
        prevNode instanceof classes.Record
        && node instanceof classes.Record
        && prevNode.getId() !== node.getId()
      )
    ) {
      /* eslint-disable-next-line react/no-did-update-set-state */
      this.setState({ opened: [], linkOpen: null });
    }
  }

  /**
   * Formats specific identifier properties of input ontology.
   * @param {Object} inputNode - Ontology being displayed.
   * @param {boolean} isNested - Nested flag.
   */
  formatIdentifiers(inputNode, isNested) {
    const { schema } = this.props;
    const { opened } = this.state;
    let node = inputNode;
    if (!(inputNode instanceof classes.Record)) {
      node = schema.newRecord(inputNode);
    }
    const identifiers = node.constructor.getIdentifiers();

    return (
      identifiers.map((prop) => {
        const [key, nestedKey] = prop.split('.');
        const value = nestedKey ? (node[key] || {})[nestedKey] : node[key];
        let properties = Object.keys(node[key] || {});

        if (node[key] instanceof classes.Record) {
          properties = node[key].constructor.getIdentifiers();
        }
        const expanded = nestedKey ? (
          <Collapse
            in={opened.includes(`${node['@rid']}${prop}`)}
            unmountOnExit
          >
            <List className="detail-nested-list">
              {properties.map((nestedProp) => {
                if (!node[key]) return null;
                const [nestedPropKey, veryNestedKey] = nestedProp.split('.');
                const nestedValue = veryNestedKey
                  ? (node[key][nestedPropKey] || {})[veryNestedKey]
                  : node[key][nestedPropKey];
                return (
                  nestedValue && (
                    <ListItem key={nestedProp}>
                      {isNested && (
                        <ListItemIcon className="nested-spacer">
                          <div style={{ width: 24, height: 24 }} />
                        </ListItemIcon>)}
                      <ListItemText>
                        <div className="detail-identifiers">
                          <Typography color="textSecondary" className="detail-identifiers-nested">
                            {util.antiCamelCase(nestedPropKey)}
                          </Typography>
                          <Typography>
                            {util.formatStr(nestedValue)}
                          </Typography>
                        </div>
                      </ListItemText>
                    </ListItem>
                  ));
              })}
            </List>
          </Collapse>
        ) : null;
        if (value) {
          if (value.toString().length <= MAX_STRING_LENGTH) {
            return (
              <React.Fragment key={prop}>
                <ListItem
                  button={!!nestedKey}
                  onClick={nestedKey ? () => this.handleExpand(`${node['@rid']}${prop}`) : undefined}
                >
                  {isNested && (
                    <ListItemIcon className="nested-spacer">
                      <div style={{ width: 24, height: 24 }} />
                    </ListItemIcon>)}
                  <ListItemText>
                    <div className="detail-identifiers">
                      <Typography variant="subtitle1" color={isNested ? 'textSecondary' : 'default'}>
                        {util.antiCamelCase(key)}
                      </Typography>
                      <Typography>
                        {util.formatStr(value)}
                      </Typography>
                    </div>
                  </ListItemText>
                  {nestedKey
                    && (!opened.includes(`${node['@rid']}${prop}`)
                      ? <ExpandMoreIcon />
                      : <ExpandLessIcon />)}
                </ListItem>
                {expanded}
                <Divider />
              </React.Fragment>
            );
          }
          return this.formatLongValue(key, value, true, isNested);
        }
        return null;
      })
    );
  }

  /**
   * Formats a key/value pair as a collapsible list item.
   * @param {string} key - property key.
   * @param {any} value - property value.
   * @param {boolean} isStatic - if true, locks list item open.
   * @param {boolean} isNested - if true, list item is indented.
   */
  formatLongValue(key, value, isStatic, isNested) {
    const { opened } = this.state;
    const listItemProps = isStatic === true
      ? {}
      : { button: true, onClick: () => this.handleExpand(key) };
    const collapseProps = isStatic === true
      ? { in: true }
      : { in: !!opened.includes(key) };
    let itemIcon = null;
    if (isStatic !== true) {
      itemIcon = !opened.includes(key)
        ? <ExpandMoreIcon />
        : <ExpandLessIcon />;
    }
    return (
      <React.Fragment key={key}>
        <ListItem {...listItemProps}>
          {isNested && (
            <ListItemIcon className="nested-spacer">
              <div style={{ width: 24, height: 24 }} />
            </ListItemIcon>)}
          <ListItemText>
            <Typography variant="subtitle1" color={isNested ? 'textSecondary' : 'default'}>
              {util.antiCamelCase(key)}
            </Typography>
          </ListItemText>
          {itemIcon}
        </ListItem>
        <Collapse {...collapseProps} unmountOnExit>
          <ListItem dense>
            {isNested && (
              <ListItemIcon className="nested-spacer">
                <div style={{ width: 24, height: 24 }} />
              </ListItemIcon>)}
            <ListItemText>
              {util.formatStr(value)}
            </ListItemText>
          </ListItem>
        </Collapse>
        <Divider />
      </React.Fragment>
    );
  }

  /**
   * Formats non-identifier, non-relationship properties.
   * @param {Object} node - Ontology being displayed.
   */
  formatOtherProps(node) {
    const { opened } = this.state;
    const { schema } = this.props;
    const identifiers = node.constructor.getIdentifiers();

    let properties = Object.keys(node)
      .map(key => ({ name: key, type: util.parseKBType(node[key]) }));
    if (schema && schema.getClass(node['@class'])) {
      ({ properties } = schema.getClass(node['@class']));
    }
    let isEmpty = true;
    const propsList = properties
      .filter(prop => !identifiers.map(id => id.split('.')[0]).includes(prop.name)
        && !prop.name.startsWith('in_')
        && !prop.name.startsWith('out_'))
      .map((prop) => {
        const { name, type } = prop;
        if (!node[name]) return null;
        isEmpty = false;
        if (type === 'string' || type === 'integer') {
          if (node[name].toString().length <= MAX_STRING_LENGTH) {
            return (
              <React.Fragment key={name}>
                <ListItem>
                  <ListItemText>
                    <div className="detail-identifiers">
                      <Typography variant="subtitle1">
                        {util.antiCamelCase(name)}
                      </Typography>
                      <Typography>
                        {util.formatStr(node[name])}
                      </Typography>
                    </div>
                  </ListItemText>
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          }
          return this.formatLongValue(name, node[name]);
        }
        if (type === 'embeddedset' && node[name].length !== 0) {
          return (
            <React.Fragment key={name}>
              <ListItem button onClick={() => this.handleExpand(name)}>
                <ListItemText primary={util.antiCamelCase(name)} />
                {!opened.includes(name) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!opened.includes(name)} unmountOnExit>
                <List disablePadding dense>
                  {node[name].map(item => (
                    <ListItem key={item}>
                      <ListItemText inset primary={util.formatStr(item)} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
              <Divider />
            </React.Fragment>
          );
        }
        if (type === 'link' || type === 'embedded') {
          return (
            <React.Fragment key={name}>
              <ListItem button onClick={() => this.handleExpand(name)}>
                <ListItemText primary={util.antiCamelCase(name)} />
                {!opened.includes(name) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!opened.includes(name)} unmountOnExit>
                <List disablePadding dense className="detail-nested-list">
                  {this.formatIdentifiers(node[name], true)}
                </List>
              </Collapse>
              <Divider />
            </React.Fragment>
          );
        }
        return null;
      });
    return !isEmpty
      ? propsList
      : null;
  }

  /**
   * Formats ontology relationships.
   * @param {Object} inputNode - Ontology being displayed.
   */
  formatRelationships(inputNode) {
    const { linkOpen } = this.state;
    const { schema } = this.props;
    let node = inputNode;
    // Checks subclasses
    if (!(inputNode instanceof classes.Record)) {
      node = schema.newRecord(inputNode);
    }
    const edges = node.getEdges();

    if (!edges || edges.length === 0) return null;
    return (
      <List>
        {edges.map((edge) => {
          const isOpen = linkOpen === edge['@rid'];
          const isIn = edge.in && edge.in['@rid'] === node.getId();
          const targetNode = schema.newRecord(isIn ? edge.out : edge.in);
          let preview;
          try {
            preview = targetNode.getPreview();
          } catch (e) {
            preview = 'Invalid variant';
          }
          return (
            <React.Fragment key={edge['@rid']}>
              <ListItem
                button
                onClick={() => this.handleLinkExpand(edge['@rid'])}
              >
                <ListItemIcon>
                  <div style={{ display: 'inline-flex' }}>
                    <LinkIcon color={isOpen ? 'secondary' : 'action'} />
                  </div>
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    color: isOpen ? 'secondary' : 'default',
                  }}
                  primary={preview}
                  secondary={util.getEdgeLabel(`${isIn ? 'in' : 'out'}_${edge['@class']}`)}
                />
                {!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!isOpen} unmountOnExit>
                <List
                  dense
                  disablePadding
                  className="detail-nested-list"
                >
                  <Divider />
                  <ListSubheader
                    className="detail-nested-subheader"
                    color="primary"
                  >
                    Link Properties
                  </ListSubheader>
                  {this.formatIdentifiers(edge, true)}
                  <ListSubheader
                    className="detail-nested-subheader"
                    color="primary"
                  >
                    Linked Record
                  </ListSubheader>
                  {this.formatIdentifiers(isIn ? edge.out : edge.in, true)}
                </List>
                <Divider />
              </Collapse>
            </React.Fragment>);
        })}
      </List>
    );
  }

  /**
   * Toggles collapsed list item.
   * @param {string} key - list item key.
   */
  handleExpand(key) {
    const { opened } = this.state;
    if (opened.includes(key)) {
      opened.splice(opened.indexOf(key), 1);
    } else {
      opened.push(key);
    }
    this.setState({ opened });
  }

  /**
   * Toggles collapsed link list item.
   * @param {string} key - list item key.
   */
  handleLinkExpand(key) {
    const { linkOpen, opened } = this.state;
    if (linkOpen === key) {
      this.setState({ linkOpen: null, opened: opened.filter(o => !o.includes(key)) });
    } else {
      this.setState({ linkOpen: key });
    }
  }

  render() {
    const {
      node,
      onClose,
      isEdge,
      handleNodeEditStart,
    } = this.props;
    if (!node) return null;
    const identifiers = this.formatIdentifiers(node);
    const otherProps = this.formatOtherProps(node);
    const relationships = this.formatRelationships(node);
    let preview;
    let errorMessage;
    try {
      preview = node.getPreview();
      // Only for kbp nodes so far.
    } catch (e) {
      preview = 'Invalid variant';
      errorMessage = e.message;
    }
    return (
      <Drawer
        open={!!node}
        anchor="right"
        variant="permanent"
        id="detail-drawer"
        classes={{ paper: `detail-root ${!node ? 'detail-closed' : ''}` }}
      >
        <div className="detail-content">
          <div className="detail-heading">
            <div className="detail-headline">
              <div>
                <Typography variant="h4" component="h1">
                  {preview}
                </Typography>
                {errorMessage && (
                  <Typography color="error" variant="subtitle2">
                    {errorMessage}
                  </Typography>
                )}
              </div>
              <IconButton onClick={onClose}>
                <ChevronRightIcon />
              </IconButton>
            </div>
            <div className="detail-edit-btn">
              <Button
                onClick={handleNodeEditStart}
                variant="outlined"
              >
                Edit {node.constructor.name}&nbsp;
                <EditIcon />
              </Button>
            </div>
          </div>
          <Divider />
          {identifiers}
          {otherProps}
          {!isEdge && (
            <React.Fragment>
              <ListSubheader className="detail-relationships-subheader">
                Relationships
              </ListSubheader>
              {relationships || (
                <ListItem>
                  <ListItemText
                    inset
                    primaryTypographyProps={{ color: 'textSecondary' }}
                    primary="None"
                  />
                </ListItem>
              )}
            </React.Fragment>
          )}
        </div>
      </Drawer>
    );
  }
}

/**
 * @namespace
 * @property {Object} schema - Knowledgebase schema object.
 * @property {Object} node - Ontology to be displayed in drawer.
 * @property {function} onClose - Function triggered on @material-ui/Drawer onClose event.
 * @property {function} handleNodeEditStart - Function triggered on node edit button click.
 * @property {bool} isEdge - Flag for edge classes.
 */
DetailDrawer.propTypes = {
  schema: PropTypes.object,
  node: PropTypes.object,
  onClose: PropTypes.func,
  isEdge: PropTypes.bool,
  handleNodeEditStart: PropTypes.func,
  identifiers: PropTypes.array,
};

DetailDrawer.defaultProps = {
  schema: null,
  node: null,
  onClose: null,
  isEdge: false,
  handleNodeEditStart: PropTypes.func,
  identifiers: [],
};

export default DetailDrawer;
