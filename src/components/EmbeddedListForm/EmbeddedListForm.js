import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './EmbeddedListForm.css';
import {
  TextField,
  Chip,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import AddIcon from '@material-ui/icons/Add';
import RefreshIcon from '@material-ui/icons/Refresh';

class EmbeddedListForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deleted: [],
      temp: '',
      initList: props.list.slice(),
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
  }

  /**
 * Adds new subset to state list. Clears subset field.
 * @param {Event} e - User request subset add event.
 */
  handleAdd(e) {
    e.preventDefault();
    const {
      list,
      name,
      onChange,
    } = this.props;

    const {
      temp,
    } = this.state;

    if (temp && !list.includes(temp.toLowerCase())) {
      list.push(temp);
      onChange({ target: { name, value: list } });
      this.setState({ temp: '' });
    }
  }

  /**
   * Deletes subset from state subset list.
   * @param {string} val - Subset to be deleted.
   */
  handleDelete(val) {
    const {
      deleted,
      initList,
    } = this.state;
    const {
      list,
      onChange,
      name,
    } = this.props;
    if (list.indexOf(val) !== -1) {
      list.splice(list.indexOf(val), 1);
      onChange({ target: { name, value: list } });
      if (initList && initList.includes(val)) {
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
    const {
      name,
      onChange,
      list,
    } = this.props;
    const { deleted } = this.state;
    deleted.splice(deleted.indexOf(val), 1);
    list.push(val);
    onChange({ target: { name, value: list } });
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
      label,
    } = this.props;

    const embeddedList = list
      .map(s => (
        <Chip
          label={s}
          deleteIcon={<CancelIcon />}
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
      <div className="embedded-list-wrapper">
        <TextField
          className="embedded-list-textfield"
          id={`${label.toLowerCase()}-temp`}
          label={label}
          value={temp}
          onChange={this.handleChange}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              this.handleAdd(e);
            }
            if (e.keyCode === 8 && !temp) {
              this.handleDelete(list[list.length - 1]);
            }
          }}
          InputProps={{
            classes: {
              root: 'embedded-list-field',
            },
            inputProps: {
              className: 'embedded-list-input',
            },
            startAdornment: embeddedList.length > 0 ? embeddedList : undefined,
          }}
        />
        <div className="embedded-list-btns">
          <IconButton
            color="primary"
            onClick={this.handleAdd}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>
    );
  }
}

EmbeddedListForm.propTypes = {
  onChange: PropTypes.func.isRequired,
  list: PropTypes.array,
  label: PropTypes.string,
  name: PropTypes.string,
};

EmbeddedListForm.defaultProps = {
  list: [],
  label: '',
  name: '',
};

export default EmbeddedListForm;
