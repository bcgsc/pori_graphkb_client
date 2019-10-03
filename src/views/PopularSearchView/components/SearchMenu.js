import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@material-ui/core';
import SearchOption from './SearchOption';


function SearchMenu(props) {
  const { labels, value, handleChange } = props;
  const searchOptions = labels.map(((label, index) => (
    <SearchOption
      label={label}
      selected={value === index}
      handleChange={() => handleChange(index)}
    />
  )));
  return (
    <Card>
      <CardContent>
        {searchOptions}
      </CardContent>
    </Card>

  );
}

SearchMenu.propTypes = {
  handleChange: PropTypes.func,
  labels: PropTypes.array.isRequired,
  value: PropTypes.number.isRequired,
};

SearchMenu.defaultProps = {
  handleChange: () => {},
};

export default SearchMenu;
