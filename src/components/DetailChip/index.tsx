/**
 * @module /components/DetailChip
 */
import './index.scss';

import {
  Avatar,
  Card,
  CardContent,
  Chip,
  ChipProps as MuiChipProps,
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
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface DefaultPopupComponentProps {
  /** description of object. Defaults to title of card if title is not present */
  label: string;
  /** record object. properties will be extracted to be displayed */
  details?: Record<string, unknown>;
  /** converts objs to string value for display */
  valueToString?: (arg: unknown) => string;
  /** finds routeName for displayed record */
  getLink?: (arg: Record<string, unknown> | undefined) => string;
  /** title of card. Will usually be record displayName */
  title?: string;
}

/**
 * Default card pop up component displayed outlining details of record.
 */
function DefaultPopupComponent(props: DefaultPopupComponentProps) {
  const {
    details: retrievedDetails,
    label,
    valueToString = (s) => `${s}`,
    getLink,
    title,
  } = props;

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
              (name) => (
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
}

DefaultPopupComponent.defaultProps = {
  details: {},
  valueToString: (s) => `${s}`,
  getLink: null,
  title: null,
};

interface DetailChipProps<PopProps extends Record<string, unknown>> {
  /** label for the record */
  label: string;
  /** record to be displayed in chip. */
  details?: Record<string, unknown>;
  /** function handler for the user clicking the X on the chip */
  onDelete?: () => void;
  /** function to call on details values */
  valueToString?: () => string;
  /** properties passed to the chip element */
  ChipProps?: Partial<MuiChipProps>;
  /** the title for the pop-up card (defaults to the chip label) */
  title?: string;
  /** function component constructor */
  PopUpComponent?: (renderProps: PopProps & DefaultPopupComponentProps) => JSX.Element;
  /** props for PopUpComponent so that it mounts correctly */
  PopUpProps?: PopProps;
  className?: string;
  getLink?: unknown;
}

/**
 * Displays a record as a Material Chip. When clicked, opens a Popover
 * containing some brief details about the record.
 */
function DetailChip<P extends Record<string, unknown>>(props: DetailChipProps<P>) {
  const {
    details,
    onDelete,
    className,
    label,
    valueToString,
    ChipProps,
    getLink,
    title,
    PopUpComponent = DefaultPopupComponent as any,
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
  onDelete: null,
  valueToString: (s) => `${s}`,
  getLink: null,
  title: null,
};

export default DetailChip;
