import './index.scss';

import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

const TableOfContents = ({ sections, baseRoute }) => (
  <List>
    {sections.map(({ id, label }) => {
      const anchorId = id;
      return (
        <ListItem>
          <ListItemIcon className="letter-icon">
            {label.slice(0, 1)}
          </ListItemIcon>
          <ListItemText>
            <a href={`${baseRoute}#${anchorId}`}> {label}</a>
          </ListItemText>
        </ListItem>
      );
    })}
  </List>
);

TableOfContents.propTypes = {
  baseRoute: PropTypes.string.isRequired,
  sections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
};

export default TableOfContents;
