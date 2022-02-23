import {
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import LetterIcon from '@/components/LetterIcon';

function TableOfContents({ sections, baseRoute }) {
  return (
    <List>
      {sections.map(({ id, label }) => (
        <ListItem key={id}>
          <LetterIcon value={label.slice(0, 1)} />
          <ListItemText>
            <a href={`${baseRoute}#${id}`}> {label}</a>
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
}

TableOfContents.propTypes = {
  baseRoute: PropTypes.string.isRequired,
  sections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
};

export default TableOfContents;
