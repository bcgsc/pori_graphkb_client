/**
 * @module /components/OntologyDetailComponent
 */
/* eslint-disable */

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
} from '@material-ui/core';
// import EditIcon from '@material-ui/icons/Edit';
import CloseIcon from '@material-ui/icons/Close';
import TitleIcon from '@material-ui/icons/Title';
import LabelIcon from '@material-ui/icons/Label';
import LabelImportantIcon from '@material-ui/icons/LabelImportant';
import BookmarkIcon from '@material-ui/icons/Bookmark';


class DetailDrawer extends Component {
  render() {
    return (
      <Drawer
        open
        anchor="right"
        variant="persistent"
        classes={{ paper: 'detail-root' }}
      >
        <div className="detail-headline paper">
          <Typography variant="title" component="h1">
            Properties:
          </Typography>
          <IconButton>
            <CloseIcon />
          </IconButton>
        </div>
        <Divider />
        <div className="detail-important paper">
          <Typography
            variant="body1"
            color="textSecondary"
            component="h5"
          >
            Important
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <LabelIcon />
              </ListItemIcon>
              <ListItemText primary="disease or disorder" secondary="name" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LabelImportantIcon />
              </ListItemIcon>
              <ListItemText primary="c2991" secondary="sourceId" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <BookmarkIcon />
              </ListItemIcon>
              <ListItemText primary="ncit" secondary="source" />
            </ListItem>
          </List>
        </div>
        <Divider />
        <div className="detail-other paper">
          <Typography
            variant="body1"
            color="textSecondary"
            component="h5"
          >
            Other
          </Typography>
        </div>
      </Drawer>
    );
  }
}

export default DetailDrawer;
