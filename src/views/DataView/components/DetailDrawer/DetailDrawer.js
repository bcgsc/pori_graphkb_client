/**
 * @module /components/OntologyDetailComponent
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  ListSubheader,
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import LinkIcon from '@material-ui/icons/Link';
import CloseIcon from '@material-ui/icons/Close';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

import './DetailDrawer.scss';
import util from '../../../../services/util';
import { KBContext } from '../../../../components/KBContext';

const MAX_STRING_LENGTH = 64;
const DATE_KEYS = ['createdAt', 'deletedAt'];

/**
 * Component used to display record details in a side drawer. Dynamically
 * generates display based on record, and its corresponding schema entry.
 *
 * @property {object} props
 * @property {Object} props.node - Ontology to be displayed in drawer.
 * @property {function} props.onClose - Function triggered on @material-ui/Drawer onClose event.
 * @property {function} props.handleNodeEditStart - Function triggered on node edit button click
 */
class DetailDrawer extends Component {
  static contextType = KBContext;

  static propTypes = {
    node: PropTypes.object,
    onClose: PropTypes.func,
    isEdge: PropTypes.bool,
  };

  static defaultProps = {
    node: null,
    onClose: null,
    isEdge: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      opened: [],
      linkOpen: null,
    };
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
    const { schema } = this.context;
    if (!node['@class']) return null;

    const { properties } = schema.get(node);
    const identifiers = ['@class', '@rid'];
    return this.formatProps(node, identifiers.reduce((array, id) => {
      const [key, nestedKey] = id.split('.');
      if (!schema.getMetadata().find(p => p.name === key)) {
        if (properties[key]) {
          if (nestedKey) {
            array.push({ ...properties[key] });
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
    const { schema } = this.context;
    return this.formatProps(node, schema.getMetadata(), isNested);
  }

  /**
   * Formats properties, varying structure based on property type.
   * @param {Object} node - Record being displayed.
   * @param {Array.<Object>} properties - List of properties to display.
   * @param {boolean} isNested - Nested flag.
   */
  formatProps(node, properties, isNested) {
    const { schema } = this.context;
    const { opened } = this.state;
    const identifiers = ['displayName', '@rid', 'sourceId'];
    return properties.map((prop) => {
      const { type } = prop;
      let { name } = prop;
      let value = node[name];
      const nestedValue = null;
      if (!value) return null;
      if (type === 'embeddedset' || type === 'linkset') {
        if (value.length === 0) return null;
        return (
          <React.Fragment key={name}>
            <ListItem dense>
              <ListItemText className="detail-li-text">
                <Typography variant="subtitle1">
                  {util.antiCamelCase(name)}
                </Typography>
              </ListItemText>
            </ListItem>
            <List disablePadding dense>
              {type === 'linkset' && value.map(item => (
                <>
                  <ListItem key={item['@rid']} button onClick={() => this.handleExpand(item)} dense>
                    <div className="nested-spacer" />
                    <ListItemText className="detail-li-text">
                      <div className="detail-identifiers-linkset">
                        <Typography variant="subtitle1" color={opened.includes(item) ? 'secondary' : 'textSecondary'}>
                          {util.antiCamelCase(item['@class'])}
                        </Typography>
                        <Typography color={opened.includes(item) ? 'secondary' : 'textSecondary'}>
                          {schema.getPreview(item)}
                        </Typography>
                      </div>
                    </ListItemText>
                    {!opened.includes(item) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                  </ListItem>
                  <Collapse in={!!opened.includes(item)} unmountOnExit>
                    {identifiers.map(propName => (
                      <List disablePadding dense>
                        <ListItem>
                          <ListItemText>
                            <div className="detail-identifiers">
                              <Typography variant="subtitle2" className="detail-identifiers-nested">
                                {util.antiCamelCase(propName)}
                              </Typography>
                              <Typography>
                                {item[propName]}
                              </Typography>
                            </div>
                          </ListItemText>
                        </ListItem>
                      </List>
                    ))}
                  </Collapse>
                </>
              ))}
              { type === 'embeddedset' && value.map(item => (
                <ListItem key={item} dense>
                  <div className="nested-spacer" />
                  <ListItemText
                    inset
                    className="detail-li-text"
                    primary={util.formatStr(item)}
                  />
                </ListItem>
              )) }
            </List>
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
          if (previewStr === null) {
            previewStr = value.displayName;
          }
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
                <List disablePadding dense className="detail-drawer__nested-list">
                  {this.formatIdentifiers(value, true)}
                  {type === 'link' && (
                    [value['@class'], '@rid', 'sourceId'].map((item, index) => (
                      <ListItem key={item} dense>
                        <div className="nested-spacer" />
                        <ListItemText className="detail-li-text">
                          <div className="detail-identifiers">
                            <Typography variant="subtitle1">
                              {util.antiCamelCase(item)}
                            </Typography>
                            <Typography>
                              {value[identifiers[index]]}
                            </Typography>
                          </div>
                        </ListItemText>
                      </ListItem>
                    ))
                  )}
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
      if (name === 'displayNameTemplate') {
        name = 'Statement';
        value = schema.getPreview(node);
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
    const { schema } = this.context;
    const identifiers = ['@class', '@rid'];

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
    const { linkOpen } = this.state;
    const { schema } = this.context;
    // Checks subclasses
    const edges = schema.getEdges(node);

    if (!edges || edges.length === 0) return null;
    return (
      <List>
        {edges.map((edge) => {
          const isOpen = linkOpen === edge['@rid'];
          let isIn = false;
          if (edge.in !== undefined) {
            isIn = edge.in && edge.in['@rid'] === node['@rid'];
          }
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
                  secondary={schema.get(edge['@class'])[isIn ? 'reverseName' : 'name']}
                />
                {!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!isOpen} unmountOnExit>
                <List
                  dense
                  disablePadding
                  className="detail-drawer__nested-list"
                >
                  <Divider />
                  <ListSubheader disableSticky color="primary">
                    Linked Record
                  </ListSubheader>
                  {this.formatIdentifiers(isIn ? edge.out : edge.in, true)}
                  {this.formatOtherProps(isIn ? edge.out : edge.in, true)}
                  {this.formatMetadata(isIn ? edge.out : edge.in, true)}
                </List>
                <Divider />
              </Collapse>
            </React.Fragment>
          );
        })}
      </List>
    );
  }

  /**
   * Toggles collapsed list item.
   * @param {string} key - list item key.
   */
  @boundMethod
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
  @boundMethod
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
    } = this.props;
    const { opened } = this.state;
    const { schema, auth } = this.context;

    const drawerIsOpen = Boolean(node);

    let content = null;
    if (drawerIsOpen) {
      const recordId = node['@rid'].slice(1);

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
      content = (
        <div className="detail-drawer__content">
          <div className="detail-drawer__heading">
            <div>
              <Typography variant="h2">
                {preview}
              </Typography>
              {errorMessage && (
              <Typography color="error" variant="subtitle2">
                {errorMessage}
              </Typography>
              )}
            </div>
            {auth.hasWriteAccess() && (
              <Link to={`/edit/${recordId}`} target="_blank">
                <IconButton
                  variant="outlined"
                >
                  <EditIcon />
                </IconButton>
              </Link>
            )}
            <Link to={`/view/${recordId}`} target="_blank">
              <IconButton
                variant="outlined"
              >
                <OpenInNewIcon />
              </IconButton>
            </Link>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
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
              className="detail-drawer__nested-list"
            >
              {metadata}
            </List>
          </Collapse>
          <Divider />
          {identifiers}
          {otherProps}
          {!isEdge && (
          <>
            <ListSubheader className="detail-drawer__relationships-subheader">
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
          </>
          )}
        </div>
      );
    }

    return (
      <Drawer
        open={drawerIsOpen}
        anchor="right"
        variant="permanent"
        classes={{
          paper: `detail-drawer ${!drawerIsOpen
            ? 'detail-drawer--closed'
            : ''
          }`,
        }}
      >
        {content}
      </Drawer>
    );
  }
}

export default DetailDrawer;
