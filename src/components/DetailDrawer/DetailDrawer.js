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
import { Ontology } from '../../services/ontology';


const IDENTIFIERS = ['@class', 'name', 'sourceId', 'source.name'];
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
        prevNode instanceof Ontology
        && node instanceof Ontology
        && prevNode.getId() !== node.getId()
      )
    ) {
      /* eslint-disable-next-line react/no-did-update-set-state */
      this.setState({ opened: [], linkOpen: null });
    }
  }

  /**
   * Formats specific identifier properties of input ontology.
   * @param {Object} node - Ontology being displayed.
   * @param {boolean} nested - Nested flag.
   */
  formatIdentifiers(node, nested) {
    if (!node) return null;
    const { schema } = this.props;
    const { opened } = this.state;
    return (
      IDENTIFIERS.map((prop) => {
        const [key, nestedKey] = prop.split('.');
        const value = nestedKey ? (node[key] || {})[nestedKey] : node[key];
        let properties = Object.keys(node[key] || {}).map(k => ({ name: k }));
        if (schema) {
          // If property is a class in the schema, we can grab its properties.
          ({ properties } = util.getClass(key, schema));
        }
        const expanded = nestedKey ? (
          properties.map(nestedProp => (
            node[key][nestedProp.name] && (
              <React.Fragment key={nestedProp.name}>
                <Collapse in={opened.includes(`${node['@rid']}${prop}`)} unmountOnExit>
                  <ListItem>
                    {nested && (
                      <ListItemIcon>
                        <div style={{ width: 24, height: 24 }} />
                      </ListItemIcon>)}
                    <ListItemText>
                      <div className="detail-identifiers">
                        <Typography color="textSecondary" className="detail-identifiers-nested">
                          {util.antiCamelCase(nestedProp.name)}
                        </Typography>
                        <Typography>
                          {util.formatStr(node[key][nestedProp.name])}
                        </Typography>
                      </div>
                    </ListItemText>
                  </ListItem>
                </Collapse>
              </React.Fragment>
            )))
        ) : null;
        if (value) {
          if (value.toString().length <= MAX_STRING_LENGTH) {
            return (
              <React.Fragment key={prop}>
                <ListItem
                  button={!!nestedKey}
                  onClick={nestedKey ? () => this.handleExpand(`${node['@rid']}${prop}`) : undefined}
                >
                  {nested && (
                    <ListItemIcon>
                      <div style={{ width: 24, height: 24 }} />
                    </ListItemIcon>)}
                  <ListItemText>
                    <div className="detail-identifiers">
                      <Typography variant="subtitle1" color={nested ? 'textSecondary' : 'default'}>
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
          return this.formatLongValue(key, value, true);
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
   */
  formatLongValue(key, value, isStatic) {
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
          <ListItemText primary={util.antiCamelCase(key)} />
          {itemIcon}
        </ListItem>
        <Collapse {...collapseProps} unmountOnExit>
          <ListItem dense>
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
    if (!node) return null;
    const { opened } = this.state;
    const { schema } = this.props;
    let properties = Object.keys(node)
      .map(key => ({ name: key, type: util.parseKBType(node[key]) }));
    if (schema) {
      ({ properties } = util.getClass(node['@class'], schema));
    }
    let isEmpty = true;
    const propsList = properties
      .filter(prop => !IDENTIFIERS.map(id => id.split('.')[0]).includes(prop.name)
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
        if (type === 'embeddedset') {
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
        if (type === 'link') {
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
   * @param {Object} node - Ontology being displayed.
   */
  formatRelationships(node) {
    if (!node) return null;
    const { linkOpen } = this.state;
    if (!(node instanceof Ontology)) {
      node = new Ontology(node);
    }
    const edges = node.getEdges();
    if (!edges || edges.length === 0) return null;
    return (
      <List>
        {edges.map((edge) => {
          const isOpen = linkOpen === edge['@rid'];
          const isIn = edge.in && edge.in['@rid'] === node.getId();
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
                  primary={util.getPreview(isIn ? edge.out : edge.in)}
                  secondary={util.getEdgeLabel(`${isIn ? 'in' : 'out'}_${edge['@class']}`)}
                />
                {!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!isOpen} unmountOnExit>
                <List dense disablePadding className="detail-nested-list">
                  <ListSubheader
                    className="detail-nested-subheader"
                    color="inherit"
                  >
                    Link Properties
                  </ListSubheader>
                  {this.formatIdentifiers(edge, true)}
                  <ListSubheader
                    className="detail-nested-subheader"
                    color="inherit"
                  >
                    Linked Ontology
                  </ListSubheader>
                  {this.formatIdentifiers(isIn ? edge.out : edge.in, true)}
                </List>
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
    const identifiers = this.formatIdentifiers(node);
    const otherProps = this.formatOtherProps(node);
    const relationships = this.formatRelationships(node);
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
              <Typography variant="h6" component="h1">
                Properties:
              </Typography>
              <IconButton onClick={onClose}>
                <ChevronRightIcon />
              </IconButton>
            </div>
            <div className="detail-edit-btn">
              <Button
                onClick={handleNodeEditStart}
                variant="outlined"
              >
                Edit Ontology&nbsp;
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
};

DetailDrawer.defaultProps = {
  schema: null,
  node: null,
  onClose: null,
  isEdge: false,
  handleNodeEditStart: PropTypes.func,
};

export default DetailDrawer;
