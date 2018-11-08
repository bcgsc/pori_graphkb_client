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

  handlePopoverClose() {
    this.setState({ anchorEl: null });
  }

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
              <div className="record-chip-panel-row">
                <Typography variant="subtitle1">@class</Typography>
                <Typography variant="subtitle2">{record['@class']}</Typography>
              </div>
              <div className="record-chip-panel-row">
                <Typography variant="subtitle1">@rid</Typography>
                <Typography variant="subtitle2">{record.getId()}</Typography>
              </div>
              {record.source && (
                <div className="record-chip-panel-row">
                  <Typography variant="subtitle1">Source</Typography>
                  <Typography variant="subtitle2">{record.source && record.source.name}</Typography>
                </div>
              )}
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
