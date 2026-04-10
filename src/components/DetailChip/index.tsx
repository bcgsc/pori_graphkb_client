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

interface DefaultPopupComponentProps<D extends object> {
  /** description of object. Defaults to title of card if title is not present */
  label: string;
  /** record object. properties will be extracted to be displayed */
  details?: D;
  getDetails?: (arg: Partial<D> | undefined) => Record<string, unknown> | undefined;
  /** finds routeName for displayed record */
  getLink?: (...args: unknown[]) => string;
  /** title of card. Will usually be record displayName */
  title?: string;
  /** converts objs to string value for display */
  valueToString?: (details: unknown | undefined) => string;
}

/**
 * Default card pop up component displayed outlining details of record.
 */
function DefaultPopupComponent<D extends object>(props: DefaultPopupComponentProps<D>) {
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
              <IconButton aria-label="open in new tab">
                <OpenInNewIcon />
              </IconButton>
            </Link>
          )}
        </div>
        <Divider />
        <Table>
          <TableBody>
            {Boolean(retrievedDetails) && Object.keys(retrievedDetails!).sort().map(
              (name) => (
                <TableRow key={name} className="detail-popover__row">
                  <TableCell>
                    <Typography variant="h6">{name}</Typography>
                  </TableCell>
                  <TableCell>
                    {valueToString(retrievedDetails?.[name])}
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

interface DetailChipProps<D extends object = Record<string, unknown>> extends DefaultPopupComponentProps<D> {
  /** label for the record */
  label: string;
  /** properties passed to the chip element */
  ChipProps?: Pick<React.ComponentProps<typeof Chip>, 'variant' | 'color'>;
  /** function component constructor */
  PopUpComponent?: (props: Record<string, unknown>) => React.JSX.Element;
  /** function handler for the user clicking the X on the chip */
  onDelete?: (...args: unknown[]) => unknown;
  /** the title for the pop-up card (defaults to the chip label) */
  title?: string;
  // passed from getTagProps
  className?: string;
  disabled?: boolean;
  'data-item-index'?: number;
  tabIndex?: -1;
}

/**
 * Displays a record as a Material Chip. When clicked, opens a Popover
 * containing some brief details about the record.
 */
function DetailChip<D extends object>(props: DetailChipProps<D>) {
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
    tabIndex,
    'data-item-index': dataTagIndex,
    disabled,
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
    <div className="detail-chip">
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
        <PopUpComponent
          details={details}
          getDetails={getDetails}
          getLink={getLink}
          label={label}
          title={title}
          valueToString={valueToString}
        />
      </Popover>
      <Chip
        classes={{
          avatar: 'detail-chip__avatar',
          outlined: 'detail-chip__outlined',
        }}
        className={`detail-chip__root ${className || ''}`}
        clickable
        color={ChipProps.color}
        data-item-index={dataTagIndex}
        disabled={disabled}
        label={label}
        onClick={handlePopoverOpen}
        onDelete={onDelete}
        tabIndex={tabIndex}
        variant={ChipProps.variant}
      />
    </div>
  );
}

export default DetailChip;
