import './index.scss';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
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
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

interface DefaultPopupComponentProps<D> {
  /** description of object. Defaults to title of card if title is not present */
  label: string;
  /** record object. properties will be extracted to be displayed */
  details?: D;
  getDetails?: (...args: unknown[]) => unknown;
  /** finds routeName for displayed record */
  getLink?: (...args: unknown[]) => string;
  /** title of card. Will usually be record displayName */
  title?: string;
  /** converts objs to string value for display */
  valueToString?: (details: D | undefined) => string;
}

/**
 * Default card pop up component displayed outlining details of record.
 */
function DefaultPopupComponent<D>(props: DefaultPopupComponentProps<D>) {
  const {
    details = {},
    getDetails = (d) => d,
    label,
    valueToString = (s) => `${s}`,
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

interface DetailChipProps<D = Record<string, unknown>> {
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
  details?: D;
  /** function to retrieve the details from the details object */
  getDetails?: (...args: unknown[]) => unknown;
  getLink?: (...args: unknown[]) => string;
  /** function handler for the user clicking the X on the chip */
  onDelete?: (...args: unknown[]) => unknown;
  /** the title for the pop-up card (defaults to the chip label) */
  title?: string;
  /** function to call on details values */
  valueToString?: (details: D | undefined) => string;
}

/**
 * Displays a record as a Material Chip. When clicked, opens a Popover
 * containing some brief details about the record.
 */
function DetailChip<D>(props: DetailChipProps<D>) {
  const {
    details,
    onDelete,
    className = '',
    getDetails,
    label,
    valueToString,
    ChipProps = {
      variant: 'outlined',
      color: 'primary',
    },
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
  const handlePopoverClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  /**
   * Opens popover.
   * @param {Event} event - User click event.
   */
  const handlePopoverOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  return (
    <div className="detail-chip" {...rest}>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        className="detail-chip__popover detail-popover"
        onClick={(e) => e.stopPropagation()}
        onClose={handlePopoverClose}
        onMouseDown={(e) => e.stopPropagation()}
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

export default DetailChip;
