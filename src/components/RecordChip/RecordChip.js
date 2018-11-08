import React, { Component } from 'react';
import './RecordChip.css';
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

class RecordChip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
    };
    this.handlePopoverOpen = this.handlePopoverOpen.bind(this);
    this.handlePopoverClose = this.handlePopoverClose.bind(this);
  }

  /**
   * Closes popover.
   */
  handlePopoverClose() {
    this.setState({ anchorEl: null });
  }

  /**
   * Opens popover.
   * @param {Event} e - User click event.
   */
  handlePopoverOpen(e) {
    this.setState({ anchorEl: e.currentTarget });
  }

  render() {
    const {
      record,
      ...other
    } = this.props;
    const { anchorEl } = this.state;

    let className = 'record-chip-root';
    if (other.className) {
      className = `${className} ${other.className}`;
    }

    return (
      <React.Fragment>
        <Popover
          open={!!anchorEl}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          onClose={this.handlePopoverClose}
        >
          <Card>
            <CardContent className="record-chip-panel">
              <Typography variant="h6" gutterBottom>{record.getPreview()}</Typography>
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
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Typography variant="body2">@rid</Typography>
                    </TableCell>
                    <TableCell />
                    <TableCell padding="checkbox">
                      {record.getId()}
                    </TableCell>
                  </TableRow>
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
          label={record.getPreview()}
          className={className}
          clickable
          avatar={<Avatar><AssignmentOutlinedIcon /></Avatar>}
          variant="outlined"
          color="primary"
          onClick={this.handlePopoverOpen}
        />
      </React.Fragment>
    );
  }
}
export default RecordChip;
