import {
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import React from 'react';

import LetterIcon from '@/components/LetterIcon';

interface TableOfContentsProps {
  baseRoute: string;
  sections: {
    id: string,
    label: string
  }[];
}

function TableOfContents(props: TableOfContentsProps) {
  const {
    sections,
    baseRoute,
  } = props;
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

export default TableOfContents;
