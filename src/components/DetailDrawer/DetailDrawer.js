/**
 * @module /components/OntologyDetailComponent
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './DetailDrawer.css';
import {
  Typography,
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

const MAX_STRING_LENGTH = 64;
const DATE_KEYS = ['createdAt', 'deletedAt'];

/**
 * Component used to display record details in a side drawer. Dynamically
 * generates display based on record, and its corresponding schema entry.
 */
class DetailDrawer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: [],
      linkOpen: null,
    };
    this.formatProps = this.formatProps.bind(this);
    this.formatRelationships = this.formatRelationships.bind(this);
    this.formatMetadata = this.formatMetadata.bind(this);
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
  formatIdentifiers(node, isNested) {
    const { schema } = this.props;
    if (!node['@class']) return null;
    const { identifiers, properties } = schema.get(node);
    return this.formatProps(node, identifiers.reduce((array, id) => {
      const [key, nestedKey] = id.split('.');
      if (!schema.getMetadata().find(p => p.name === key)) {
        if (properties[key]) {
          if (nestedKey) {
            array.push({ ...properties[key], previewWith: nestedKey });
          } else {
            array.push(properties[key]);
          }
        }
        if (key === 'preview') {
          array.push({ type: 'string', name: 'preview' });
        }
      }

      return array;
    }, []), isNested);
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
        <ListItem {...listItemProps} dense>
          {isNested && (
            <div className="nested-spacer" />
          )}
          <ListItemText className="detail-li-text">
            <Typography variant="subtitle1" color={isNested ? 'textSecondary' : 'default'}>
              {util.antiCamelCase(key)}
            </Typography>
          </ListItemText>
          {itemIcon}
        </ListItem>
        <Collapse {...collapseProps} unmountOnExit>
          <ListItem dense>
            {isNested && (
              <div className="nested-spacer" />
            )}
            <ListItemText className="detail-li-text">
              {util.formatStr(value)}
            </ListItemText>
          </ListItem>
        </Collapse>
        <Divider />
      </React.Fragment>
    );
  }

  /**
   * Formats record metadata.
   * @param {Object} node - Record to be formatted.
   * @param {boolean} isNested - Nested flag.
   */
  formatMetadata(node, isNested) {
    const { schema } = this.props;
    return this.formatProps(node, schema.getMetadata(), isNested);
  }

  /**
   * Formats properties, varying structure based on property type.
   * @param {Object} node - Record being displayed.
   * @param {Array.<Object>} properties - List of properties to display.
   * @param {boolean} isNested - Nested flag.
   */
  formatProps(node, properties, isNested) {
    const { schema } = this.props;
    const { opened } = this.state;
    return properties.map((prop) => {
      const { name, type, previewWith } = prop;
      const value = name === 'preview' ? schema.getPreview(node) : node[name];
      let nestedValue = null;
      if (previewWith && value) {
        nestedValue = value[previewWith];
      }
      if (!value) return null;
      if (type === 'embeddedset' || type === 'linkset') {
        if (value.length === 0) return null;
        return (
          <React.Fragment key={name}>
            <ListItem button onClick={() => this.handleExpand(name)} dense>
              <ListItemText className="detail-li-text">
                <Typography variant="subtitle1">
                  {util.antiCamelCase(name)}
                </Typography>
              </ListItemText>
              {!opened.includes(name) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </ListItem>
            <Collapse in={!!opened.includes(name)} unmountOnExit>
              <List disablePadding dense>
                {type === 'linkset' && value.map(item => (
                  <ListItem key={item['@rid']} dense>
                    <div className="nested-spacer" />
                    <ListItemText className="detail-li-text">
                      <div className="detail-identifiers">
                        <Typography variant="subtitle1">
                          {item['@class']}
                        </Typography>
                        <Typography>
                          {schema.getPreview(item)}
                        </Typography>
                      </div>
                    </ListItemText>
                  </ListItem>
                ))}
                {type === 'embeddedset' && value.map(item => (
                  <ListItem key={item} dense>
                    <div className="nested-spacer" />
                    <ListItemText
                      inset
                      className="detail-li-text"
                      primary={util.formatStr(item)}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
            <Divider />
          </React.Fragment>
        );
      }
      if ((type === 'link' || type === 'embedded') && value['@class']) {
        let previewStr;
        let listItemProps = {};
        if (isNested) {
          previewStr = schema.getPreview(value);
        } else {
          listItemProps = { button: true, onClick: () => this.handleExpand(name) };
          previewStr = nestedValue && (DATE_KEYS.includes(name)
            ? (new Date(nestedValue)).toLocaleString()
            : util.formatStr(nestedValue));
          if (type === 'embedded') {
            previewStr = value['@class'];
          }
        }
        return (
          <React.Fragment key={name}>
            <ListItem {...listItemProps} dense>
              {isNested && (
                <div className="nested-spacer" />
              )}
              <ListItemText className="detail-li-text">
                <div className="detail-identifiers">
                  <Typography variant="subtitle1">
                    {util.antiCamelCase(name)}
                  </Typography>
                  <Typography>
                    {previewStr}
                  </Typography>
                </div>
              </ListItemText>
              {!isNested && (!opened.includes(name) ? <ExpandMoreIcon /> : <ExpandLessIcon />)}
            </ListItem>
            {!isNested && (
              <Collapse in={!!opened.includes(name)} unmountOnExit>
                <List disablePadding dense className="detail-nested-list">
                  {this.formatIdentifiers(value, true)}
                  {type === 'embedded' && this.formatOtherProps(value, true)}
                </List>
              </Collapse>
            )}
            <Divider />
          </React.Fragment>
        );
      }
      if (value.toString().length <= MAX_STRING_LENGTH) {
        let Wrapper = React.Fragment;
        const compProps = {};
        if (name === 'url') {
          Wrapper = 'a';
          compProps.href = value;
          compProps.target = '_blank';
        }
        return (
          <React.Fragment key={name}>
            <ListItem dense>
              {isNested && (
                <div className="nested-spacer" />
              )}
              <ListItemText className="detail-li-text">
                <div className="detail-identifiers">
                  <Typography variant="subtitle1">
                    {util.antiCamelCase(name)}
                  </Typography>
                  <Wrapper {...compProps}>
                    <Typography>
                      {DATE_KEYS.includes(name)
                        ? (new Date(value)).toLocaleString()
                        : util.formatStr(value)}
                    </Typography>
                  </Wrapper>
                </div>
              </ListItemText>
            </ListItem>
            <Divider />
          </React.Fragment>
        );
      }
      return this.formatLongValue(name, value, true, isNested);
    });
  }

  /**
   * Formats non-identifying, non-metadata properties of the input record.
   * @param {Object} node - Record being displayed.
   * @param {boolean} isNested - Nested flag.
   */
  formatOtherProps(node, isNested) {
    const { schema } = this.props;
    const { identifiers } = schema.get(node);

    let properties = Object.keys(node)
      .map(key => ({ name: key, type: util.parseKBType(node[key]) }));
    if (schema && schema.getProperties(node)) {
      properties = schema.getProperties(node);
    }
    const propsList = Object.values(properties)
      .filter(prop => !identifiers.map(id => id.split('.')[0]).includes(prop.name)
        && !prop.name.startsWith('in_')
        && !prop.name.startsWith('out_'));

    return this.formatProps(node, propsList, isNested);
  }

  /**
   * Formats record relationships.
   * @param {Object} node - Record being displayed.
   */
  formatRelationships(node) {
    const { linkOpen, opened } = this.state;
    const { schema } = this.props;
    // Checks subclasses
    const edges = schema.getEdges(node);

    if (!edges || edges.length === 0) return null;
    return (
      <List>
        {edges.map((edge) => {
          const metaOpen = opened.includes(`${edge['@rid']}meta`);
          const isOpen = linkOpen === edge['@rid'];
          const isIn = edge.in && edge.in['@rid'] === node['@rid'];
          const targetNode = isIn ? edge.out : edge.in;
          if (targetNode['@rid'] === node['@rid']) return null;
          let preview;
          try {
            preview = schema.getPreview(targetNode);
          } catch (e) {
            preview = 'Invalid variant';
          }
          return (
            <React.Fragment key={edge['@rid']}>
              <ListItem
                button
                onClick={() => this.handleLinkExpand(edge['@rid'])}
                className="detail-link-wrapper"
                dense
              >
                <ListItemIcon>
                  <div style={{ display: 'inline-flex' }}>
                    <LinkIcon color={isOpen ? 'secondary' : 'action'} />
                  </div>
                </ListItemIcon>
                <ListItemText
                  className="detail-li-text"
                  primaryTypographyProps={{
                    color: isOpen ? 'secondary' : 'default',
                  }}
                  primary={<Typography variant="subtitle1">{preview}</Typography>}
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
                  <ListSubheader disableSticky color="primary">
                    Link Properties
                  </ListSubheader>
                  {this.formatOtherProps(edge, true)}
                  <ListItem dense button onClick={() => this.handleExpand(`${edge['@rid']}meta`)}>
                    <div className="nested-spacer" />
                    <ListItemText className="detail-li-text">
                      <Typography variant="subtitle1" color={metaOpen ? 'secondary' : 'default'}>
                        Metadata
                      </Typography>
                    </ListItemText>
                    {!metaOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </ListItem>
                  <Collapse in={!!metaOpen}>
                    {this.formatMetadata(edge, true)}
                  </Collapse>
                  <ListSubheader disableSticky color="primary">
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
      schema,
    } = this.props;
    const { opened } = this.state;
    if (!node) return null;
    const identifiers = this.formatIdentifiers(node);
    const otherProps = this.formatOtherProps(node);
    const relationships = !isEdge && this.formatRelationships(node);
    const metadata = this.formatMetadata(node, true);

    const metadataIsOpen = opened.includes('metadata');

    let preview;
    let errorMessage;
    try {
      preview = schema.getPreview(node);
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
              <Button onClick={onClose} variant="fab" color="primary">
                <ChevronRightIcon />
              </Button>
            </div>
            <div className="detail-edit-btn">
              {(schema.isSubclass(node, ['Ontology', 'Variant'])
                || node['@class'] === 'Statement')
                && (
                  <Button
                    onClick={handleNodeEditStart}
                    variant="outlined"
                  >
                    Edit {node['@class']}&nbsp;
                    <EditIcon />
                  </Button>
                )}
            </div>
          </div>
          <Divider />
          <ListItem
            button
            onClick={() => this.handleExpand('metadata')}
            dense
          >
            <ListItemText
              primaryTypographyProps={{
                color: metadataIsOpen ? 'secondary' : 'default',
              }}
              primary={<Typography variant="subtitle1">Metadata</Typography>}
            />
            {!metadataIsOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </ListItem>
          <Collapse in={!!metadataIsOpen} unmountOnExit>
            <List
              dense
              disablePadding
              className="detail-nested-list"
            >
              {metadata}
            </List>
          </Collapse>
          <Divider />
          {identifiers}
          {otherProps}
          {!isEdge && (
            <React.Fragment>
              <ListSubheader className="detail-relationships-subheader">
                Relationships
              </ListSubheader>
              {relationships || (
                <ListItem dense>
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
 * @property {bool} isEdge - Flag for edge classes.
 * @property {function} handleNodeEditStart - Function triggered on node edit button click.
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
