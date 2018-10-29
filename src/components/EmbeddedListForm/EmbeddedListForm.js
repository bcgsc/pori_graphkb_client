import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './EmbeddedListForm.css';
import {
  Paper,
  Typography,
  TextField,
  Chip,
  InputAdornment,
  IconButton,
  List,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import RefreshIcon from '@material-ui/icons/Refresh';

class EmbeddedListForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deleted: [],
      temp: '',
    };
    this.handleChange = this.handleChange.bind(this);
  }

  /**
 * Adds new subset to state list. Clears subset field.
 * @param {Event} e - User request subset add event.
 */
  handleAdd(e) {
    e.preventDefault();
    const { onAdd, list } = this.props;
    const { temp } = this.state;

    if (temp && !list.includes(temp.toLowerCase())) {
      onAdd(temp);
      this.setState({ temp: '' });
    }
  }

  /**
   * Deletes subset from state subset list.
   * @param {string} val - Subset to be deleted.
   */
  handleDelete(val) {
    const { deleted } = this.state;
    const {
      list,
      undoable,
      initList,
      onDelete,
    } = this.props;
    if (list.indexOf(val) !== -1) {
      onDelete(val);
      if (undoable && initList.includes(val)) {
        deleted.push(val);
      }
    }
    this.setState({ deleted });
  }

  /**
   * Reverts a subset that is staged for deletion.
   * @param {string} val - deleted subset to be reverted.
   */
  handleUndo(val) {
    const { onUndo } = this.props;
    const { deleted } = this.state;
    deleted.splice(deleted.indexOf(val), 1);
    if (onUndo) onUndo(val);
    this.setState({ deleted });
  }

  handleChange(e) {
    this.setState({ temp: e.target.value });
  }

  render() {
    const {
      deleted,
      temp,
    } = this.state;
    const {
      list,
      title,
      label,
    } = this.props;

    const embeddedList = list
      .sort((a, b) => a > b ? 1 : -1)
      .map(s => (
        <Chip
          label={s}
          deleteIcon={<CloseIcon />}
          onDelete={() => this.handleDelete(s)}
          key={s}
          className="embedded-list-chip"
        />
      ));

    embeddedList.push(...deleted.map(s => (
      <Chip
        label={s}
        deleteIcon={<RefreshIcon />}
        onDelete={() => this.handleUndo(s)}
        key={s}
        className="embedded-list-chip deleted-chip"
      />
    )));
    return (
      <Paper className="embedded-list-wrapper">
        <Typography variant="h6">
          {title}
        </Typography>
        <div className="embedded-list-input">
          <TextField
            id={`${title}-temp`}
            label={label}
            value={temp}
            onChange={this.handleChange}
            onKeyDown={(e) => {
              if (e.keyCode === 13) {
                this.handleAdd(e);
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    onClick={this.handleAdd}
                  >
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </div>
        <List className="embedded-list">
          {embeddedList}
        </List>
      </Paper>
    );
  }
}

EmbeddedListForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUndo: PropTypes.func,
  list: PropTypes.array,
  initList: PropTypes.array,
  undoable: PropTypes.bool,
  label: PropTypes.string,
  title: PropTypes.string,
};

EmbeddedListForm.defaultProps = {
  onUndo: null,
  list: [],
  initList: [],
  undoable: false,
  label: '',
  title: '',
};

export default EmbeddedListForm;
