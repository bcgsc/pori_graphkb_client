import './index.scss';

import { Paper } from '@material-ui/core';
import propTypes from 'prop-types';
import React from 'react';

import ModelSelect from '@/components/ModelSelect';

const NewRecordSelectView = (props) => {
  const {
    history,
    match: {
      params: { modelName },
    },
  } = props;

  const redirectToModel = ({ target: { value } }) => {
    history.push(`/new/${value}`);
  };

  return (
    <div className="new-record-view-select">
      <Paper className="new-record-view-select__select-model">
        <ModelSelect
          baseModel={modelName}
          className="record-form__class-select"
          onChange={redirectToModel}
          value=""
          variant="radio"
        />
      </Paper>
    </div>
  );
};

NewRecordSelectView.propTypes = {
  history: propTypes.object.isRequired,
  match: propTypes.object.isRequired,
};

export default NewRecordSelectView;
