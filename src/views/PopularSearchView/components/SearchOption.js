import React from 'react';
import {
  Typography, ButtonBase,
} from '@material-ui/core';
import PropTypes from 'prop-types';

function SearchOption(props) {
  const { label, selected, handleChange } = props;
  return (
    <div className={`popular-search__menuItem${selected ? '--selected' : ''}`}>
      <ButtonBase onClick={handleChange}>
        <Typography variant="h5" color={selected ? 'secondary' : ''}>
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
