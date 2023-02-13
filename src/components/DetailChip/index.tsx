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
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const defaultValueToString = (s: unknown) => `${s}`;

interface DefaultPopupComponentProps {
  /** description of object. Defaults to title of card if title is not present */
  label: string;
  /** record object. properties will be extracted to be displayed */
  details?: Record<string, unknown>;
  /** finds routeName for displayed record */
  getLink?: (...args: unknown[]) => string;
  /** title of card. Will usually be record displayName */
  title?: string;
  /** converts objs to string value for display */
  valueToString?: (value: unknown) => string;
}

/**
 * Default card pop up component displayed outlining details of record.
 */
const DefaultPopupComponent = (props: DefaultPopupComponentProps) => {
  const {
    details,
    label,
    valueToString = defaultValueToString,
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
          {getLink && getLink(details) && (
            <Link target="_blank" to={getLink(details)}>
              <IconButton>
                <OpenInNewIcon />
              </IconButton>
            </Link>
          )}
        </div>
        <Divider />
        <Table>
          <TableBody>
            {details && Object.keys(details).sort().map(
              (name) => (
                <TableRow key={name} className="detail-popover__row">
                  <TableCell>
                    <Typography variant="h6">{name}</Typography>
                  </TableCell>
                  <TableCell>
                    {valueToString(details[name])}
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

DefaultPopupComponent.defaultProps = {
  details: {},
  valueToString: defaultValueToString,
  getLink: null,
  title: null,
};

interface DetailChipProps {
  /** label for the record */
  label: string;
  /** properties passed to the chip element */
  ChipProps?: Partial<React.ComponentProps<typeof Chip>>;
  /** function component constructor */
  PopUpComponent?: (props: Record<string, unknown>) => JSX.Element;
  /** props for PopUpComponent so that it mounts correctly */
  PopUpProps?: Record<string, unknown>;
  className?: string;
  /** record to be displayed in chip. */
  details?: Record<string, unknown>;
  getLink?: (...args: unknown[]) => string;
  /** function handler for the user clicking the X on the chip */
  onDelete?: (...args: unknown[]) => unknown;
  /** the title for the pop-up card (defaults to the chip label) */
  title?: string;
  /** function to call on details values */
  valueToString?: (value: unknown) => string;
}

/**
 * Displays a record as a Material Chip. When clicked, opens a Popover
 * containing some brief details about the record.
 */
function DetailChip(props: DetailChipProps) {
  const {
    details,
    onDelete,
    className,
    label,
    valueToString,
    ChipProps,
    getLink,
    title,
    PopUpComponent = DefaultPopupComponent,
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
  valueToString: defaultValueToString,
  getLink: null,
  title: null,
};

export default DetailChip;
