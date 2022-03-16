/**
 * @module /components/OntologyDetailComponent
 */
import './index.scss';

import {
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import EditIcon from '@material-ui/icons/Edit';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { GeneralRecordPropType } from '@/components/types';
import schema from '@/services/schema';
import util from '@/services/util';

import { useAuth } from '../Auth';
import LinkEmbeddedPropList from './LinkEmbeddedPropList';
import RelationshipList from './RelationshipList';
import SetPropsList from './SetPropsList';
import TextRow from './TextRow';

/**
 * Takes properties list to be displayed in detail drawer and promotes an inputted
 * property to top of the list. For display purposes.
 *
 * @property {Array.<PropertyModel>} properties array of property models to be rearranged
 * @property {string} propToBeMovedToTop property to be promoted to top of array for display
 */
const movePropToTop = (properties, propToBeMovedToTop) => {
  const propIndex = properties.findIndex((prop) => prop.name === propToBeMovedToTop);
  const updatedProperties = [...properties];

  if (propIndex !== 0 && propIndex !== -1) {
    updatedProperties.splice(propIndex, 1);
    updatedProperties.unshift(properties[propIndex]);
  }
  return updatedProperties;
};

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

  const auth = useAuth();

  const [opened, setOpened] = useState([]);

  /**
   * Toggles collapsed list item.
   * @param {string} key - list item key.
   */
  const handleExpand = (key) => {
    if (opened.includes(key)) {
      opened.splice(opened.indexOf(key), 1);
    } else {
      opened.push(key);
    }
    setOpened([...opened]);
  };

  const [linkOpen, setLinkOpen] = useState(null);

  /**
   * Toggles collapsed link list item.
   * @param {string} key - list item key.
   */
  const handleLinkExpand = (key) => {
    if (linkOpen === key) {
      setLinkOpen(null);
      setOpened(opened.filter((o) => !o.includes(key)));
    } else {
      setLinkOpen(key);
    }
  };

  /**
   * Formats properties, varying structure based on property type. Base function
   * that other formatting functions call.
   * @param {Object} record - Record being displayed for its details.
   * @param {Array.<Object>} properties - List of property models to display.
   * @param {boolean} isNested - Nested flag.
   */
  const formatProps = (record, properties, isNested) => {
    const identifiers = ['displayName', '@rid', 'sourceId'];
    const updatedProperties = movePropToTop(properties, 'displayName');

    return updatedProperties.map((prop) => {
      const { type } = prop;
      let { name } = prop;
      let value = record[name];
      if (!value) return null;
      if (type === 'embeddedset' || type === 'linkset') {
        const formattedSetProps = (
          <SetPropsList
            handleExpand={handleExpand}
            identifiers={identifiers}
            opened={opened}
            prop={prop}
            value={value}
          />
        );
        return formattedSetProps;
      }
      if ((type === 'link' || type === 'embedded') && value['@class']) {
        const linkEmbeddedProps = (
          <LinkEmbeddedPropList
            // eslint-disable-next-line no-use-before-define
            formatOtherProps={formatOtherProps}
            handleExpand={handleExpand}
            identifiers={identifiers}
            isNested={isNested}
            opened={opened}
            prop={prop}
            value={value}
          />
        );
        return linkEmbeddedProps;
      }
      if (name === 'displayNameTemplate') {
        name = 'Statement';
        value = schema.getLabel(node, false);
      }
      return (
        <TextRow
          handleExpand={handleExpand}
          isNested={isNested}
          isStatic
          name={name}
          opened={opened}
          value={value}
        />
      );
    });
  };

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
   * @param {boolean} isNested - Nested flag indicating if record is embedded
   */
  const formatOtherProps = (record, isNested) => {
    const identifiers = ['@class', '@rid'];

    let properties = Object.keys(record)
      .map((key) => ({ name: key, type: util.parseKBType(record[key]) }));

    if (schema && schema.getProperties(record)) {
      properties = schema.getProperties(record);
    }
    const propsList = Object.values(properties)
      .filter((prop) => !identifiers.map((id) => id.split('.')[0]).includes(prop.name)
        && !prop.name.startsWith('in_')
        && !prop.name.startsWith('out_'));

    return formatProps(record, propsList, isNested);
  };

  const drawerIsOpen = Boolean(node);
  let content = null;

  if (drawerIsOpen) {
    const recordId = node['@rid'].replace(/^#/, '');
    const recordClass = node['@class'];

    const otherProps = formatOtherProps(node);
    const metadata = formatMetadata(node, true);

    const metadataIsOpen = opened.includes('metadata');

    let preview;
    let errorMessage;

    try {
      preview = schema.getLabel(node);
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
          {auth.hasWriteAccess && (
          <Link target="_blank" to={`/edit/${recordClass}/${recordId}`}>
            <IconButton
              variant="outlined"
            >
              <EditIcon />
            </IconButton>
          </Link>
          )}
          <Link target="_blank" to={`/view/${recordClass}/${recordId}`}>
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
            primary={<Typography>Metadata</Typography>}
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
            {!isEdge ? (
              <RelationshipList
                formatMetadata={formatMetadata}
                formatOtherProps={formatOtherProps}
                handleLinkExpand={handleLinkExpand}
                linkOpen={linkOpen}
                record={node}
              />
            ) : (
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
