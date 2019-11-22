import { Chip } from '@material-ui/core';
import React from 'react';

/**
 * Search/Filter chips to be displayed at top of DataTable. Used to provide
 * feedback to users the specifics of search performed
 *
 * @property {object} params key value pair, each key has an associated value
 */
function FilterChips(props) {
  const {
    ...params
  } = props;

  const chips = [];
  Object.entries(params).forEach(([key, param]) => {
    const operator = '=';
    const isChipProp = key.toLowerCase().includes('chip');
    const label = isChipProp ? param : `${key} ${operator} ${param}`;
    chips.push((
      <Chip
        key={key}
        label={label}
      />
    ));
  });
  return chips;
}


export default FilterChips;
