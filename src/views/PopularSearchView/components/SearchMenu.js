import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@material-ui/core';
import SearchOption from './SearchOption';

/**
 * Displays popular search menu and menu items.
 *
 * @property {ArrayOf<Strings>} props.labels labels for menu item search searchOptions
 * @property {integer} props.selected index of selected menu item
 * @property {function} props.handleChange parent handler for menu item selection
 */
function SearchMenu(props) {
  const { labels, value, handleChange } = props;
  const searchOptions = labels.map(((label, index) => (
    <SearchOption
      key={`${label}`}
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
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.number.isRequired,
};

SearchMenu.defaultProps = {
  handleChange: () => {},
};

export default SearchMenu;
