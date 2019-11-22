import {
  ButtonBase,
  Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Displays individual popular search option that populates search menu.
 */
function SearchOption(props) {
  const { label, selected, handleChange } = props;
  return (
    <div className={`popular-search__menu-item${selected ? '--selected' : ''}`}>
      <ButtonBase onClick={handleChange}>
        <Typography variant="h5" color={selected ? 'primary' : 'initial'}>
          {label}
        </Typography>
      </ButtonBase>
    </div>
  );
}

SearchOption.propTypes = {
  handleChange: PropTypes.func,
  label: PropTypes.string,
  selected: PropTypes.bool,
};

SearchOption.defaultProps = {
  handleChange: () => {},
  label: '',
  selected: false,
};

export default SearchOption;
