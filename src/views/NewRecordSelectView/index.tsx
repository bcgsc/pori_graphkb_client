import './index.scss';

import { Paper } from '@material-ui/core';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ModelSelect from '@/components/ModelSelect';

const NewRecordSelectView = ({ modelName: modelNameParamProp }: { modelName: string }) => {
  const { modelName: modelNameParams } = useParams();
  // Use props over params
  const modelName = modelNameParamProp ?? modelNameParams;
  const navigate = useNavigate();

  const redirectToModel = ({ target: { value } }) => {
    navigate(`/new/${value}`);
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

export default NewRecordSelectView;
