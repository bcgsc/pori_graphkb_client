import React from 'react';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  List,
} from '@material-ui/core';
import LabelIcon from '@material-ui/icons/Label';
import LabelTwoToneIcon from '@material-ui/icons/LabelTwoTone';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';
import AssignmentIcon from '@material-ui/icons/Assignment';
import LabelImportantIcon from '@material-ui/icons/LabelImportant';
import BookmarkIcon from '@material-ui/icons/Bookmark';
import LinkIcon from '@material-ui/icons/Link';
import ClassIcon from '@material-ui/icons/Class';
import DescriptionIcon from '@material-ui/icons/Description';
import ListAltIcon from '@material-ui/icons/ListAlt';
import DateRangeIcon from '@material-ui/icons/DateRange';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import BioTypeIcon from '../../components/BioTypeIcon/BioTypeIcon';
import OpenBookIcon from '../../components/OpenBookIcon/OpenBookIcon';
import WWWIcon from '../../components/WWWIcon/WWWIcon';
import util from '../../services/util';

const PROP_TO_ICON = {
  name: <LabelIcon />,
  sourceId: <LabelImportantIcon />,
  source: <BookmarkIcon />,
  description: <DescriptionIcon />,
  subsets: <ListAltIcon />,
  longName: <LabelTwoToneIcon />,
  sourceIdVersion: <LocalOfferIcon />,
  biotype: <BioTypeIcon />,
  journalName: <OpenBookIcon />,
  year: <DateRangeIcon />,
  startYear: <DateRangeIcon />,
  endYear: <DateRangeIcon />,
  city: <LocationCityIcon />,
  country: <LocationOnIcon />,
  url: <WWWIcon />,
  dependency: <AssignmentOutlinedIcon />,
  '@class': <ClassIcon />,
};

/**
 * Feedback page
 */
function iconsview() {
  return (
    <List style={{ columnCount: 3 }}>
      {Object.entries(PROP_TO_ICON).map(pair => (
        <ListItem key={pair[0]} style={{ display: 'inline-flex' }}>
          <ListItemIcon>
            <div>
              {pair[1]}
            </div>
          </ListItemIcon>
          <ListItemText primary={util.antiCamelCase(pair[0])} />
        </ListItem>
      ))}
      <ListItem style={{ display: 'inline-flex' }}>
        <ListItemIcon>
          <div>
            <LinkIcon />
          </div>
        </ListItemIcon>
        <ListItemText primary="Edges" />
      </ListItem>
      <ListItem style={{ display: 'inline-flex' }}>
        <ListItemIcon>
          <div>
            <AssignmentIcon />
          </div>
        </ListItemIcon>
        <ListItemText primary="Default" />
      </ListItem>
    </List>
  );
}

export default iconsview;
