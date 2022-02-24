import './index.scss';

import { Paper } from '@material-ui/core';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import ModelSelect from '@/components/ModelSelect';

function NewRecordSelectView(props: RouteComponentProps<{ modelName: string }>) {
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
}

export default NewRecordSelectView;
