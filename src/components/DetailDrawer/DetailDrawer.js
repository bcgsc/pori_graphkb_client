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
    };
    this.formatOtherProps = this.formatOtherProps.bind(this);
    this.formatRelationships = this.formatRelationships.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
    this.handleLinkExpand = this.handleLinkExpand.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { node: prevNode } = prevProps;
    const { node } = this.props;
    if ((!node && prevNode) || (prevNode && node && prevNode.getId() !== node.getId())) {
      /* eslint-disable-next-line react/no-did-update-set-state */
      this.setState({ opened: [], linkOpen: null });
    }
  }

  formatIdentifiers(node, nested) {
    if (!node) return null;
    const { schema } = this.props;
    const { opened } = this.state;
    return (
      IDENTIFIERS.map((prop) => {
        const [key, nestedKey] = prop.split('.');
        const value = nestedKey ? node[key][nestedKey] : node[key];
        const expanded = nestedKey ? (
          util.getClass(key, schema).properties.map(nestedProp => (
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
                    <Typography variant="subheading" color={nested ? 'textSecondary' : 'default'}>
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
        return null;
      })
    );
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

  formatOtherProps(node) {
    if (!node) return null;
    const { opened } = this.state;
    const { schema } = this.props;
    const { properties } = util.getClass(node['@class'], schema);
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
              <React.Fragment key={name}>
                <ListItem>
                  <ListItemText>
                    <div className="detail-identifiers">
                      <Typography variant="subheading">
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

  handleExpand(key) {
    const { opened } = this.state;
    if (opened.includes(key)) {
      opened.splice(opened.indexOf(key), 1);
    } else {
      opened.push(key);
    }
    this.setState({ opened });
  }

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
          {identifiers}
          {otherProps && (
            <React.Fragment>
              {otherProps}
            </React.Fragment>
          )}
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

export default DetailDrawer;
