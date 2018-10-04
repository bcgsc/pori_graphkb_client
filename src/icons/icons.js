import React from 'react';
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
import HelpIcon from '@material-ui/icons/Help';
// import BacteriaIcon from './BacteriaIcon/BacteriaIcon';
import ChromosomeIcon from './ChromosomeIcon/ChromosomeIcon';
import DNAIcon from './DNAIcon/DNAIcon';
import FlaskIcon from './FlaskIcon/FlaskIcon';
import MoleculeIcon from './MoleculeIcon/MoleculeIcon';
import OpenBookIcon from './OpenBookIcon/OpenBookIcon';
import WWWIcon from './WWWIcon/WWWIcon';

const PROP_TO_ICON = {
  name: <LabelIcon />,
  sourceId: <LabelImportantIcon />,
  source: <BookmarkIcon />,
  description: <DescriptionIcon />,
  subsets: <ListAltIcon />,
  longName: <LabelTwoToneIcon />,
  sourceIdVersion: <LocalOfferIcon />,
  // biotype: <BacteriaIcon />,
  journalName: <OpenBookIcon />,
  year: <DateRangeIcon />,
  startYear: <DateRangeIcon />,
  endYear: <DateRangeIcon />,
  city: <LocationCityIcon />,
  country: <LocationOnIcon />,
  url: <WWWIcon />,
  dependency: <AssignmentOutlinedIcon />,
  '@class': <ClassIcon />,
  molecularFormula: <MoleculeIcon />,
  mechanismOfAction: <FlaskIcon />,
  help: <HelpIcon />,
  biotype: <DNAIcon />,
  edges: <LinkIcon />,
  default: <AssignmentIcon />,
  chromosome: <ChromosomeIcon />,
};

const getIcon = key => PROP_TO_ICON[key] || PROP_TO_ICON.default;
const getAllIcons = () => Object.entries(PROP_TO_ICON);

export default {
  getIcon,
  getAllIcons,
};
