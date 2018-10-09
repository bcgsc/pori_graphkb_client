import React from 'react';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  List,
} from '@material-ui/core';
import util from '../../services/util';
import icons from '../../icons/icons';


/**
 * Feedback page
 */
function iconsview() {
  return (
    <List style={{ columnCount: 3 }}>
      {icons.getAllIcons().map(pair => (
        <ListItem key={pair[0]} style={{ display: 'inline-flex' }}>
          <ListItemIcon>
            <div>
              {pair[1]}
            </div>
          </ListItemIcon>
          <ListItemText primary={util.antiCamelCase(pair[0])} />
        </ListItem>
      ))}
    </List>
  );
}

export default iconsview;
