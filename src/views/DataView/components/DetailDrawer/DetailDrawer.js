/**
 * @module /components/OntologyDetailComponent
 */
import './DetailDrawer.scss';

import {
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LinkIcon from '@material-ui/icons/Link';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PropTypes from 'prop-types';
import React, {
  useContext, useEffect, useState,
} from 'react';
import { Link } from 'react-router-dom';

import KbContext from '@/components/KBContext';
import { GeneralRecordPropType } from '@/components/types';
import { hasWriteAccess } from '@/services/auth';
import schema from '@/services/schema';
import util from '@/services/util';

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
function DetailDrawer(props) {
  const {
    node,
    onClose,
    isEdge,
  } = props;

  const [opened, setOpened] = useState([]);
  const [linkOpen, setLinkOpen] = useState(null);

  /**
   * Toggles collapsed list item.
   * @param {string} key - list item key.
   */
  function handleExpand(key) {
    if (opened.includes(key)) {
      opened.splice(opened.indexOf(key), 1);
    } else {
      opened.push(key);
    }
    setOpened([...opened]);
  }

  /**
   * Toggles collapsed link list item.
   * @param {string} key - list item key.
   */
  function handleLinkExpand(key) {
    if (linkOpen === key) {
      setLinkOpen(null);
      setOpened(opened.filter(o => !o.includes(key)));
    } else {
      setLinkOpen(key);
    }
  }

  /**
   * Takes properties list to be displayed in detail drawer and promotes an inputted
   * property to top of the list. For display purposes.
   *
   * @property {Array.<PropertyModel>} properties array of property models to be rearranged
   * @property {string} propToBeMovedToTop property to be promoted to top of array for display
   */
  function movePropToTop(properties, propToBeMovedToTop) {
    const propIndex = properties.findIndex(prop => prop.name === propToBeMovedToTop);
    const updatedProperties = [...properties];

    if (propIndex !== 0 && propIndex !== -1) {
      updatedProperties.splice(propIndex, 1);
      updatedProperties.unshift(properties[propIndex]);
    }
    return updatedProperties;
  }

  /**
   * sorts properties alphabetically by class and then displayname
   *
   * @param {Arrayof.<Objects>} value holds an array of Property Models
   */
  function sortProps(value) {
    const sortedValues = value.sort((a, b) => {
      if (a['@class'] === b['@class']) {
        return a.displayName.localeCompare(b.displayName);
      }
      return a['@class'].localeCompare(b['@class']);
    });
    return sortedValues;
  }


  /**
   * Renders properties that are set types. i.e Embedded set and link set.
   * @param {PropertyModel} prop link/embedded property model
   * @param {Arrayof<Objects>}  value contains link/embedded records
   * @param {Arrayof<string>} opened opened dropdowns in drawer
   * @param {Arrayof<string>} identifiers props to be displayed for submenu
   *
   */
  function renderSetTypeProps(prop, value, identifiers) {
    const { type, name } = prop;
    if (value.length === 0) return null;
    let values = [...value];

    if (type === 'linkset') {
      values = sortProps(values);
    }
    return (
      <React.Fragment key={name}>
        <ListItem dense>
          <ListItemText className="detail-li-text">
            <Typography variant="subtitle1">
              {util.antiCamelCase(name)}
            </Typography>
          </ListItemText>
        </ListItem>
        <List dense disablePadding>
          {type === 'linkset' && values.map(item => (
            <>
              <ListItem key={item['@rid']} button dense onClick={() => handleExpand(item)}>
                <div className="nested-spacer" />
                <ListItemText className="detail-li-text">
                  <div className="detail-identifiers-linkset">
                    <Typography color={opened.includes(item) ? 'secondary' : 'textSecondary'} variant="subtitle2">
                      {util.antiCamelCase(item['@class'])}
                    </Typography>
                    <Typography color={opened.includes(item) ? 'secondary' : 'textSecondary'} variant="subtitle2">
                      {schema.getPreview(item)}
                    </Typography>
                  </div>
                </ListItemText>
                {!opened.includes(item) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!opened.includes(item)} unmountOnExit>
                {identifiers.map(propName => (
                  <List dense disablePadding>
                    <ListItem>
                      <ListItemText>
                        <div className="detail-identifiers">
                          <Typography className="detail-identifiers-nested" variant="subtitle1">
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
          { type === 'embeddedset' && values.map(item => (
            <ListItem key={item} dense>
              <div className="nested-spacer" />
              <ListItemText
                className="detail-li-text"
                inset
                primary={util.formatStr(item)}
              />
            </ListItem>
          )) }
        </List>
        <Divider />
      </React.Fragment>
    );
  }


  /**
   * Renders formatted link/embedded props.
   *
   * @param {PropertyModel} prop link/embedded property model
   * @param {bool} isNested is the prop nested
   * @param {Arrayof<Objects>}  value contains link/embedded records
   * @param {Arrayof<string>} opened opened dropdowns in drawer
   * @param {Arrayof<string>} identifiers props to be displayed for submenu
   */
  function renderLinkEmbeddedProps(prop, isNested, value, identifiers) {
    const { name, type } = prop;
    let previewStr;
    let listItemProps = {};

    if (isNested) {
      previewStr = schema.getPreview(value);
    } else {
      listItemProps = { button: true, onClick: () => handleExpand(name) };
      previewStr = value.displayName;

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
              <Typography variant="body1">
                {util.antiCamelCase(name)}
              </Typography>
              <Typography variant="h6">
                {previewStr}
              </Typography>
            </div>
          </ListItemText>
          {!isNested && (!opened.includes(name) ? <ExpandMoreIcon /> : <ExpandLessIcon />)}
        </ListItem>
        {!isNested && (
        <Collapse in={!!opened.includes(name)} unmountOnExit>
          <List className="detail-drawer__nested-list" dense disablePadding>
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
            {type === 'embedded' && formatOtherProps(value, true)}
          </List>
        </Collapse>
        )}
        <Divider />
      </React.Fragment>
    );
  }


  /**
   * Formats a key/value pair as a collapsible list item.
   * @param {string} key - property key.
   * @param {any} value - property value.
   * @param {boolean} isStatic - if true, locks list item open.
   * @param {boolean} isNested - if true, list item is indented.
   */
  function formatLongValue(key, value, isStatic, isNested) {
    // const { opened } = this.state;
    const listItemProps = isStatic === true
      ? {}
      : { button: true, onClick: () => handleExpand(key) };
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
            <Typography color={isNested ? 'textSecondary' : 'default'} variant="subtitle1">
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
              {util.formatStr(schema.getPreview(value))}
            </ListItemText>
          </ListItem>
        </Collapse>
        <Divider />
      </React.Fragment>
    );
  }


  /**
   * Formats properties, varying structure based on property type.
   * @param {Object} record - Record being displayed.
   * @param {Array.<Object>} properties - List of properties to display.
   * @param {boolean} isNested - Nested flag.
   */
  function formatProps(record, properties, isNested) {
    const identifiers = ['displayName', '@rid', 'sourceId'];
    const updatedProperties = movePropToTop(properties, 'displayName');

    return updatedProperties.map((prop) => {
      const { type } = prop;
      let { name } = prop;
      let value = record[name];
      if (!value) return null;
      if (type === 'embeddedset' || type === 'linkset') {
        const formattedSetProps = renderSetTypeProps(prop, value, identifiers);
        return formattedSetProps;
      }
      if ((type === 'link' || type === 'embedded') && value['@class']) {
        const linkEmbeddedProps = renderLinkEmbeddedProps(prop, isNested, value, identifiers);
        return linkEmbeddedProps;
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
                        : util.formatStr(schema.getPreview(value))}
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
      return formatLongValue(name, value, true, isNested);
    });
  }

  /**
   * Closes all expanded list properties.
   * @param {Object} prevProps - Component's previous props.
   */
  useEffect(() => {
    if (!node) {
      setOpened([]);
      setLinkOpen(null);
    }
  }, [node]);

  /**
   * Formats record metadata.
   * @param {Object} record - Record to be formatted.
   * @param {boolean} isNested - Nested flag.
   */
  const formatMetadata = (record, isNested) => formatProps(record, schema.getMetadata(), isNested);

  /**
   * Formats non-identifying, non-metadata properties of the input record.
   * @param {Object} node - Record being displayed.
   * @param {boolean} isNested - Nested flag.
   */
  function formatOtherProps(record, isNested) {
    const identifiers = ['@class', '@rid'];

    let properties = Object.keys(record)
      .map(key => ({ name: key, type: util.parseKBType(record[key]) }));

    if (schema && schema.getProperties(record)) {
      properties = schema.getProperties(record);
    }
    const propsList = Object.values(properties)
      .filter(prop => !identifiers.map(id => id.split('.')[0]).includes(prop.name)
        && !prop.name.startsWith('in_')
        && !prop.name.startsWith('out_'));

    return formatProps(record, propsList, isNested);
  }

  /**
   * Formats record relationships.
   * @param {Object} record - Record being displayed.
   */
  function formatRelationships(record) {
    // Checks subclasses
    const edges = schema.getEdges(record);

    if (!edges || edges.length === 0) return null;
    return (
      <List>
        {edges.map((edge) => {
          const isOpen = linkOpen === edge['@rid'];
          let isIn = false;

          if (edge.in !== undefined) {
            isIn = edge.in && edge.in['@rid'] === record['@rid'];
          }
          const targetNode = isIn ? edge.out : edge.in;
          if (targetNode['@rid'] === record['@rid']) return null;
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
                className="detail-link-wrapper"
                dense
                onClick={() => handleLinkExpand(edge['@rid'])}
              >
                <ListItemIcon>
                  <div style={{ display: 'inline-flex' }}>
                    <LinkIcon color={isOpen ? 'secondary' : 'action'} />
                  </div>
                </ListItemIcon>
                <ListItemText
                  className="detail-li-text"
                  primary={<Typography variant="subtitle1">{preview}</Typography>}
                  primaryTypographyProps={{
                    color: isOpen ? 'secondary' : 'default',
                  }}
                  secondary={schema.get(edge['@class'])[isIn ? 'reverseName' : 'name']}
                />
                {!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </ListItem>
              <Collapse in={!!isOpen} unmountOnExit>
                <List
                  className="detail-drawer__nested-list"
                  dense
                  disablePadding
                >
                  <Divider />
                  <ListSubheader color="primary" disableSticky>
                    Linked Record
                  </ListSubheader>
                  {formatOtherProps(isIn ? edge.out : edge.in, true)}
                  {formatMetadata(isIn ? edge.out : edge.in, true)}
                </List>
                <Divider />
              </Collapse>
            </React.Fragment>
          );
        })}
      </List>
    );
  }

  const context = useContext(KbContext);
  const drawerIsOpen = Boolean(node);
  let content = null;

  if (drawerIsOpen) {
    const recordId = node['@rid'].slice(1);

    const otherProps = formatOtherProps(node);
    const relationships = !isEdge && formatRelationships(node);
    const metadata = formatMetadata(node, true);

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
          {hasWriteAccess(context) && (
          <Link target="_blank" to={`/edit/${recordId}`}>
            <IconButton
              variant="outlined"
            >
              <EditIcon />
            </IconButton>
          </Link>
          )}
          <Link target="_blank" to={`/view/${recordId}`}>
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
        {otherProps}
        <ListItem
          button
          dense
          onClick={() => handleExpand('metadata')}
        >
          <ListItemText
            primary={<Typography variant="subtitle1">Metadata</Typography>}
            primaryTypographyProps={{
              color: metadataIsOpen ? 'secondary' : 'default',
            }}
          />
          {!metadataIsOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </ListItem>
        <Collapse in={!!metadataIsOpen} unmountOnExit>
          <List
            className="detail-drawer__nested-list"
            dense
            disablePadding
          >
            {metadata}
          </List>
        </Collapse>
        <Divider />
        {!isEdge && (
          <>
            <ListSubheader className="detail-drawer__relationships-subheader">
                Relationships
            </ListSubheader>
            {relationships || (
            <ListItem dense>
              <ListItemText
                inset
                primary="None"
                primaryTypographyProps={{ color: 'textSecondary' }}
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
      anchor="right"
      classes={{
        paper: `detail-drawer ${!drawerIsOpen
          ? 'detail-drawer--closed'
          : ''
        }`,
      }}
      open={drawerIsOpen}
      variant="permanent"
    >
      {content}
    </Drawer>
  );
}

DetailDrawer.propTypes = {
  isEdge: PropTypes.bool,
  node: GeneralRecordPropType,
  onClose: PropTypes.func,
};


DetailDrawer.defaultProps = {
  node: null,
  onClose: null,
  isEdge: false,
};

export default DetailDrawer;
