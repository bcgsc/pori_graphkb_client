import React from 'react';
import PropTypes from 'prop-types';
import {
  Checkbox,
  Popover,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import util from '../../../../services/util';


/**
 * Displays list of records and allows filtering in a popover.
 */
function FilterPopover(props) {
  const {
    anchorEl,
    onClose,
    filterValue,
    onFilterChange,
    onFilterCheckAll,
    onFilterExclude,
    values,
    filtered,
  } = props;

  return (
    <Popover
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id="filter-popover"
    >
      <Paper className="filter-wrapper">
        <List className="filter-list">
          <ListItem dense>
            <TextField
              value={filterValue}
              onChange={onFilterChange}
              fullWidth
              margin="none"
              InputProps={{
                endAdornment: (
                  <InputAdornment><SearchIcon /></InputAdornment>
                ),
              }}
            />
          </ListItem>
          <ListItem
            button
            dense
            onClick={onFilterCheckAll}
            id="select-all-checkbox"
            classes={{
              root: 'filter-item-background',
            }}
          >
            <Checkbox
              checked={filtered.length === 0}
            />
            <ListItemText primary={filtered.length === 0 ? 'Deselect All' : 'Select All'} />
          </ListItem>
          <List
            component="div"
            dense
            disablePadding
            className="filter-exclusions-list"
          >
            {values
              .filter(o => util.castToExist(o).includes(filterValue))
              .sort((o) => {
                const option = util.castToExist(o);
                if (option === 'null') return -1;
                return 1;
              })
              .slice(0, 100)
              .map((o) => {
                const option = util.castToExist(o);
                return (
                  <ListItem
                    dense
                    key={option}
                    button
                    onClick={() => onFilterExclude(option)}
                  >
                    <Checkbox
                      checked={!filtered.includes(option)}
                    />
                    <ListItemText primary={option} />
                  </ListItem>
                );
              })}
          </List>
        </List>
      </Paper>
    </Popover>
  );
}

/**
 * @namespace
 * @property {any} anchorEl - Reference to the DOM node that the popover is
 * anchored to.
 * @property {function} onClose - Handler for popover closure.
 * @property {string} filterValue - Current filter string.
 * @property {function} onFilterChange - Handler for editing filter value.
 * @property {function} onFilterCheckAll - Handler for select all/deselect all
 * checkbox.
 * @property {function} onFilterExclude - Handler for toggling
 * selected/deselected records.
 * @property {Array} values - list of records to be displayed.
 * @property {Array} filtered - list of records that have been unselected.
 */
FilterPopover.propTypes = {
  anchorEl: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  filterValue: PropTypes.string,
  onFilterChange: PropTypes.func.isRequired,
  onFilterCheckAll: PropTypes.func.isRequired,
  onFilterExclude: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.any),
  filtered: PropTypes.arrayOf(PropTypes.string),
};

FilterPopover.defaultProps = {
  anchorEl: null,
  filterValue: '',
  values: [],
  filtered: [],
};


export default FilterPopover;
