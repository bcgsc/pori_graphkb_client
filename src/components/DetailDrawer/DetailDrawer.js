/**
 * @module /components/OntologyDetailComponent
 */

import React, { Component } from 'react';
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
  ListSubheader,
  Collapse,
  Button,
  Tooltip,
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import util from '../../services/util';
import Ontology from '../../services/ontology';
import icons from '../../icons/icons';


const IDENTIFIERS = ['@class', 'name', 'sourceId', 'source.name'];
const MAX_STRING_LENGTH = 64;

class DetailDrawer extends Component {
  static getIcon(key) {
    return (
      <div>
        <Tooltip title={util.antiCamelCase(key)}>
          {icons.getIcon(key)}
        </Tooltip>
      </div>
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      opened: [],
    };
    this.formatIdentifiers = this.formatIdentifiers.bind(this);
    this.formatOtherProps = this.formatOtherProps.bind(this);
    this.formatRelationships = this.formatRelationships.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
  }

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
          <ListItemIcon>
            {DetailDrawer.getIcon(key)}
          </ListItemIcon>
          <ListItemText primary={util.antiCamelCase(key)} />
          {itemIcon}
        </ListItem>
        <Collapse {...collapseProps}>
          <ListItem dense>
            <ListItemText>
              {util.formatStr(value)}
            </ListItemText>
          </ListItem>
        </Collapse>
      </React.Fragment>
    );
  }

  formatIdentifiers(node) {
    if (!node) return null;
    return (
      <List>
        {IDENTIFIERS.map((prop) => {
          const [key, nestedKey] = prop.split('.');
          const value = nestedKey ? (node[key] || {})[nestedKey] : node[key];
          if (value) {
            if (value.toString().length <= MAX_STRING_LENGTH) {
              return (
                <ListItem key={key}>
                  <ListItemIcon>
                    {DetailDrawer.getIcon(key)}
                  </ListItemIcon>
                  <ListItemText
                    primary={util.formatStr(value)}
                    secondary={util.antiCamelCase(key)}
                  />
                </ListItem>
              );
            }
            return this.formatLongValue(key, value, true);
          }
          return null;
        })}
      </List>
    );
  }

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
      .filter(prop => !IDENTIFIERS.map(id => id.split('.')[0]).includes(prop.name))
      .map((prop) => {
        const { name, type } = prop;
        if (!node[name]) return null;
        isEmpty = false;
        if (type === 'string' || type === 'integer') {
          if (node[name].toString().length <= MAX_STRING_LENGTH) {
            return (
              <ListItem key={name}>
                <ListItemIcon>
                  {DetailDrawer.getIcon(name)}
                </ListItemIcon>
                <ListItemText
                  primary={util.formatStr(node[name])}
                  secondary={util.antiCamelCase(name)}
                />
              </ListItem>
            );
          }
          return this.formatLongValue(name, node[name]);
        }
        if (type === 'embeddedset') {
          return (
            <React.Fragment key={name}>
              <ListItem button onClick={() => this.handleExpand(name)}>
                <ListItemIcon>
                  {DetailDrawer.getIcon(name)}
                </ListItemIcon>
                <ListItemText primary={util.antiCamelCase(name)} />
                {!opened.includes(name) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!opened.includes(name)}>
                <List disablePadding dense>
                  {node[name].map(item => (
                    <ListItem key={item}>
                      <ListItemText inset primary={util.formatStr(item)} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          );
        }
        if (type === 'link') {
          return (
            <React.Fragment key={name}>
              <ListItem button onClick={() => this.handleExpand(name)}>
                <ListItemIcon>
                  {DetailDrawer.getIcon(name)}
                </ListItemIcon>
                <ListItemText primary={util.antiCamelCase(name)} />
                {!opened.includes(name) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!opened.includes(name)}>
                <List disablePadding dense className="detail-nested-list">
                  {this.formatIdentifiers(node[name])}
                </List>
              </Collapse>
            </React.Fragment>
          );
        }
        return null;
      });
    return !isEmpty ? (
      <List>
        {propsList}
      </List>
    ) : null;
  }

  formatRelationships(node) {
    if (!node) return null;
    const { opened } = this.state;
    if (!(node instanceof Ontology)) {
      node = new Ontology(node);
    }
    const edges = node.getEdges();
    if (!edges || edges.length === 0) return null;
    return (
      <List>
        {edges.map((edge) => {
          const isOpen = opened.includes(edge['@rid']);
          const linkedOntology = edge.in && edge.in['@rid'] === node.getId() ? edge.out : edge.in;
          return (
            <React.Fragment key={edge['@rid']}>
              <ListItem
                button
                onClick={() => this.handleExpand(edge['@rid'])}
              >
                <ListItemIcon>
                  <div>
                    {icons.getIcon('edges')}
                  </div>
                </ListItemIcon>
                <ListItemText
                  primary={util.getPreview(linkedOntology)}
                  secondary={util.getEdgeLabel(edge['@class'])}
                />
                {!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!isOpen}>
                <List disablePadding className="detail-nested-list">
                  <ListSubheader>
                    Link Properties
                  </ListSubheader>
                  {this.formatIdentifiers(edge)}
                  <ListSubheader>
                    Linked Ontology
                  </ListSubheader>
                  {this.formatIdentifiers(linkedOntology)}
                </List>
              </Collapse>
            </React.Fragment>);
        })}
      </List>
    );
  }

  handleExpand(key) {
    const { opened } = this.state;
    if (opened.includes(key)) {
      opened.splice(opened.indexOf(key), 1);
    } else {
      opened.push(key);
    }
    this.setState({ opened });
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
              <Typography variant="title" component="h1">
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
          <div className="detail-important paper">
            <Typography
              variant="body1"
              color="textSecondary"
              component="h5"
            >
              Identifiers
            </Typography>
          </div>
          {identifiers}
          <Divider />
          {otherProps && (
            <React.Fragment>
              <div className="detail-other paper">
                <Typography
                  variant="body1"
                  color="textSecondary"
                  component="h5"
                >
                  Other
                </Typography>
              </div>
              {otherProps}
              <Divider />
            </React.Fragment>
          )}
          {!isEdge && (
            <React.Fragment>
              <div className="paper">
                <Typography
                  variant="body1"
                  color="textSecondary"
                  component="h5"
                >
                  Relationships
                </Typography>
              </div>
              {relationships || (
                <ListItem dense>
                  <ListItemText
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

export default DetailDrawer;
