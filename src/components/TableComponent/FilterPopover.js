import React from 'react';
import {
  Popover,
  Paper,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  InputAdornment,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

function TableFilterPopover() {
  return (
    <Popover
      anchorEl={filterPopoverNode}
      open={!!filterPopoverNode}
      onClose={() => this.setState({ filterPopoverNode: null })}
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
      <Paper className="paper">
        <List className="filter-list">
          <ListItem dense>
            <TextField
              value={columnFilterStrings[tempFilterIndex]}
              onChange={e => this.handleFilterStrings(e)}
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
            onClick={() => this.handleFilterCheckAll(filterOptions)}
            id="select-all-checkbox"
            classes={{
              root: 'filter-item-background',
            }}
          >
            <Checkbox
              checked={columnFilterExclusions[tempFilterIndex]
                && columnFilterExclusions[tempFilterIndex].length === 0
              }
            />
            <ListItemText primary={columnFilterExclusions[tempFilterIndex]
              && columnFilterExclusions[tempFilterIndex].length === 0 ? 'Deselect All' : 'Select All'}
            />
          </ListItem>
          <List component="div" dense disablePadding className="filter-exclusions-list">
            {filterOptions
              .filter((o) => {
                const filter = columnFilterStrings[tempFilterIndex];
                return util.castToExist(o).includes(filter);
              })
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
                    onClick={() => this.handleFilterExclusions(option)}
                  >
                    <Checkbox
                      checked={columnFilterExclusions[tempFilterIndex]
                        && !columnFilterExclusions[tempFilterIndex].includes(option)
                      }
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
