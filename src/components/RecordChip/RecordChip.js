/**
 * @module /components/RecordChip
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
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

import './RecordChip.scss';

/**
 * Displays a record as a Material Chip. When clicked, opens a Popover
 * containing some brief details about the record.
 *
 * @property {obejct} props
 * @property {Object} props.record - record to be displayed in chip.
 * @property {Object} props.schema - KB schema object.
 */
class RecordChip extends Component {
  static propTypes = {
    record: PropTypes.object,
    schema: PropTypes.object.isRequired,
  };

  static defaultProps = {
    record: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
    };
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
      record,
      schema,
      ...other
    } = this.props;
    const { anchorEl } = this.state;

    if (!record) return null;

    let className = 'record-chip-root';
    if (other.className) {
      className = `${className} ${other.className}`;
    }
    const id = schema ? schema.getPreview(record) : Object.values(record).find(v => typeof v === 'string');

    return (
      <>
        <Popover
          open={!!anchorEl}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          onClose={this.handlePopoverClose}
        >
          <Card>
            <CardContent className="record-chip-panel">
              <Typography variant="h6" gutterBottom>
                {id}
              </Typography>
              <Divider />
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Typography variant="body2">@class</Typography>
                    </TableCell>
                    <TableCell />
                    <TableCell padding="checkbox">
                      {record['@class']}
                    </TableCell>
                  </TableRow>
                  {record['@rid'] && (
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Typography variant="body2">@rid</Typography>
                      </TableCell>
                      <TableCell />
                      <TableCell padding="checkbox">
                        {record['@rid']}
                      </TableCell>
                    </TableRow>
                  )}
                  {record.source && (
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Typography variant="body2">Source</Typography>
                      </TableCell>
                      <TableCell />
                      <TableCell padding="checkbox">
                        {record.source && record.source.name}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Popover>
        <Chip
          {...other}
          label={id}
          className={className}
          clickable
          avatar={<Avatar><AssignmentOutlinedIcon /></Avatar>}
          variant="outlined"
          color="primary"
          onClick={this.handlePopoverOpen}
        />
      </>
    );
  }
}

export default RecordChip;
