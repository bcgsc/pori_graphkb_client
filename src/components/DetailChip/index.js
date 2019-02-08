/**
 * @module /components/DetailChip
 */
import { boundMethod } from 'autobind-decorator';
import React from 'react';
import PropTypes from 'prop-types';
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
} from '@material-ui/core';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';

import './index.scss';


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
 */
class DetailChip extends React.Component {
  static propTypes = {
    ChipProps: PropTypes.object,
    className: PropTypes.string,
    details: PropTypes.object,
    label: PropTypes.string.isRequired,
    onDelete: PropTypes.func,
    valueToString: PropTypes.func,
  };

  static defaultProps = {
    ChipProps: {
      avatar: (<Avatar><AssignmentOutlinedIcon /></Avatar>),
      variant: 'outlined',
      color: 'primary',
    },
    className: '',
    details: {},
    onDelete: null,
    valueToString: s => `${s}`,
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
      || !!anchorEl !== !!nextState.anchorEl
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
      label,
      valueToString,
      ChipProps,
      ...rest
    } = this.props;
    const { anchorEl } = this.state;

    const PopUpContent = () => (
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
            <Typography variant="h6" gutterBottom>
              {label}
            </Typography>
            <Divider />
            <Table>
              <TableBody>
                {details && Object.keys(details).map(
                  name => (
                    <TableRow key={name} className="detail-popover__row">
                      <TableCell padding="checkbox">
                        <Typography variant="body2">{name}</Typography>
                      </TableCell>
                      <TableCell />
                      <TableCell padding="checkbox">
                        {valueToString(details[name])}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Popover>
    );

    return (
      <div {...rest}>
        <PopUpContent />
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
