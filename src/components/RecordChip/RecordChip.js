import React from 'react';
import './RecordChip.css';
import {
  Chip,
  Avatar,
} from '@material-ui/core';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';

function RecordChip(props) {
  const {
    ...other
  } = props;
  let className = 'record-chip-root';
  if (other.className) {
    className = `${className} ${other.className}`;
  }

  return (
    <Chip
      {...other}
      className={className}
      clickable
      avatar={<Avatar><AssignmentOutlinedIcon /></Avatar>}
      variant="outlined"
      color="primary"
    />
  );
}
export default RecordChip;
