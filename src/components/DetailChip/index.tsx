/**
 * @module /components/DetailChip
 */
import './index.scss';

import {
  Avatar,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@material-ui/core';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Default card pop up component displayed outlining details of record.
 * @property {object} props
 * @property {object} props.details record object. properties will be extracted to be displayed
 * @property {string} props.label description of object. Defaults to title of card if title is not present
 * @property {function} props.valueToString converts objs to string value for display
 * @property {function} props.getLink finds routeName for displayed record
 * @property {string} props.title title of card. Will usually be record displayName
 */
const DefaultPopupComponent = (props) => {
  const {
    details,
    getDetails,
    label,
    valueToString,
    getLink,
    title,
  } = props;

  const retrievedDetails = getDetails(details);

  return (
    <Card>
      <CardContent className="detail-popover__panel">
        <div className="detail-popover__panel-header">
          <Typography gutterBottom variant="h4">
            {title || label}
          </Typography>
          {getLink && getLink(retrievedDetails) && (
          <Link target="_blank" to={getLink(retrievedDetails)}>
            <IconButton>
              <OpenInNewIcon />
            </IconButton>
          </Link>
          )}
        </div>
        <Divider />
        <Table>
          <TableBody>
            {retrievedDetails && Object.keys(retrievedDetails).sort().map(
              name => (
                <TableRow key={name} className="detail-popover__row">
                  <TableCell>
                    <Typography variant="h6">{name}</Typography>
                  </TableCell>
                  <TableCell>
                    {valueToString(retrievedDetails[name])}
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

DefaultPopupComponent.propTypes = {
  label: PropTypes.string.isRequired,
  details: PropTypes.object,
  getDetails: PropTypes.func,
  getLink: PropTypes.func,
  title: PropTypes.string,
  valueToString: PropTypes.func,
};

DefaultPopupComponent.defaultProps = {
  getDetails: d => d,
  details: {},
  valueToString: s => `${s}`,
  getLink: null,
  title: null,
};

/**
 * Displays a record as a Material Chip. When clicked, opens a Popover
 * containing some brief details about the record.
 *
 * @param {obejct} props
 * @property {string} props.label - label for the record
 * @property {Object} props.details - record to be displayed in chip.
 * @property {function} props.onDelete - function handler for the user clicking the X on the chip
 * @property {function} props.valueToString - function to call on details values
 * @property {object} props.ChipProps - properties passed to the chip element
 * @property {function} props.getDetails function to retrieve the details from the details object
 * @property {string} props.title the title for the pop-up card (defaults to the chip label)
 * @property {function} props.PopUpComponent function component constructor
 * @property {object} props.PopUpProps props for PopUpComponent so that it mounts correctly
 */
function DetailChip(props) {
  const {
    details,
    onDelete,
    className,
    getDetails,
    label,
    valueToString,
    ChipProps,
    getLink,
    title,
    PopUpComponent,
    PopUpProps,
    ...rest
  } = props;

  const [anchorEl, setAnchorEl] = useState(null);

  /**
   * Closes popover.
   */
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  /**
   * Opens popover.
   * @param {Event} event - User click event.
   */
  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };


  return (
    <div className="detail-chip" {...rest}>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        className="detail-chip__popover detail-popover"
        onClose={handlePopoverClose}
        open={!!anchorEl}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <PopUpComponent {...props} {...PopUpProps} />
      </Popover>
      <Chip
        classes={{
          avatar: 'detail-chip__avatar',
          outlined: 'detail-chip__outlined',
        }}
        className={`detail-chip__root ${className || ''}`}
        clickable
        label={label}
        onClick={handlePopoverOpen}
        onDelete={onDelete}
        {...ChipProps}
      />
    </div>
  );
}

DetailChip.propTypes = {
  label: PropTypes.string.isRequired,
  ChipProps: PropTypes.object,
  PopUpComponent: PropTypes.func,
  PopUpProps: PropTypes.object,
  className: PropTypes.string,
  details: PropTypes.object,
  getDetails: PropTypes.func,
  getLink: PropTypes.func,
  onDelete: PropTypes.func,
  title: PropTypes.string,
  valueToString: PropTypes.func,
};

DetailChip.defaultProps = {
  ChipProps: {
    avatar: (<Avatar><AssignmentOutlinedIcon /></Avatar>),
    variant: 'outlined',
    color: 'primary',
  },
  PopUpComponent: DefaultPopupComponent,
  PopUpProps: null,
  className: '',
  details: {},
  getDetails: d => d,
  onDelete: null,
  valueToString: s => `${s}`,
  getLink: null,
  title: null,
};

export default DetailChip;
