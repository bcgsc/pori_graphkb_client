/**
 * @module /components/DetailChip
 */
import { boundMethod } from 'autobind-decorator';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Chip,
  Avatar,
  Popover,
  Typography,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from '@material-ui/core';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

import './index.scss';
import ReviewDialog from './ReviewDialog';


const shallowObjectKey = obj => JSON.stringify(obj, (k, v) => k ? `${v}` : v);

/**
 * Displays a record as a Material Chip. When clicked, opens a Popover
 * containing some brief details about the record.
 *
 * @property {obejct} props
 * @property {string} props.label - label for the record
 * @property {Object} props.details - record to be displayed in chip.
 * @property {function} props.onDelete - function handler for the user clicking the X on the chip
 * @property {function} props.valueToString - function to call on details values
 * @property {object} props.ChipProps - properties passed to the chip element
 * @property {function} props.getDetails function to retrieve the details from the details object
 * @property {string} props.title the title for the pop-up card (defaults to the chip label)
 */
class DetailChip extends React.Component {
  static propTypes = {
    ChipProps: PropTypes.object,
    className: PropTypes.string,
    details: PropTypes.object,
    getDetails: PropTypes.func,
    label: PropTypes.string.isRequired,
    onDelete: PropTypes.func,
    valueToString: PropTypes.func,
    title: PropTypes.string,
    getLink: PropTypes.func,
    isEmbedded: PropTypes.bool,
    content: PropTypes.object,
    handleReviewSelection: PropTypes.func,
  };

  static defaultProps = {
    ChipProps: {
      avatar: (<Avatar><AssignmentOutlinedIcon /></Avatar>),
      variant: 'outlined',
      color: 'primary',
    },
    className: '',
    details: {},
    getDetails: d => d,
    onDelete: null,
    valueToString: s => `${s}`,
    getLink: null,
    title: null,
    isEmbedded: false,
    content: {},
    handleReviewSelection: () => {},
  };

  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
    };
  }

  /**
   * Only update if the contents change or the anchor was added/deleted
   * Do not update if the anchor changes (causes infinite render loop)
   */
  shouldComponentUpdate(nextProps, nextState) {
    const { label, details } = this.props;
    const { anchorEl } = this.state;
    return (
      label !== nextProps.label
      || shallowObjectKey(details) !== shallowObjectKey(nextProps.details)
      || Boolean(anchorEl) !== Boolean(nextState.anchorEl)
    );
  }

  /**
   * Closes popover.
   */
  @boundMethod
  handlePopoverClose() {
    this.setState({ anchorEl: null });
  }

  /**
   * Opens popover.
   * @param {Event} event - User click event.
   */
  @boundMethod
  handlePopoverOpen(event) {
    this.setState({ anchorEl: event.currentTarget });
  }

  render() {
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
      isEmbedded,
      content,
      handleReviewSelection,
      ...rest
    } = this.props;
    const { anchorEl } = this.state;

    const retrievedDetails = getDetails(details);

    return (
      <div className="detail-chip" {...rest}>
        <Popover
          open={!!anchorEl}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          onClose={this.handlePopoverClose}
          className="detail-chip__popover detail-popover"
        >
          <Card>
            <CardContent className="detail-popover__panel">
              <div className="detail-popover__panel-header">
                <Typography variant="h6" gutterBottom>
                  {title || label}
                </Typography>
                {getLink && getLink(retrievedDetails) && (
                  <Link to={getLink(retrievedDetails)} target="_blank">
                    <IconButton>
                      <OpenInNewIcon />
                    </IconButton>
                  </Link>
                )}
                {isEmbedded && (
                  <IconButton onClick={() => { console.log('toggling'); handleReviewSelection(content); }}>
                    <OpenInNewIcon />
                  </IconButton>
                )}
              </div>
              <Divider />
              <Table>
                <TableBody>
                  {retrievedDetails && Object.keys(retrievedDetails).sort().map(
                    name => (
                      <TableRow key={name} className="detail-popover__row">
                        <TableCell padding="checkbox">
                          <Typography variant="body2">{name}</Typography>
                        </TableCell>
                        <TableCell padding="checkbox">
                          {valueToString(retrievedDetails[name])}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Popover>
        <Chip
          label={label}
          className={`detail-chip__root ${className || ''}`}
          clickable
          onClick={this.handlePopoverOpen}
          onDelete={onDelete}
          {...ChipProps}
        />
      </div>
    );
  }
}

export default DetailChip;
