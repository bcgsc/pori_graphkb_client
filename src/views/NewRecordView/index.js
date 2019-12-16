import propTypes from 'prop-types';
import * as qs from 'qs';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import ModelSelect from '@/components/ModelSelect';
import RecordForm from '@/components/RecordForm';
import { cleanLinkedRecords, FORM_VARIANT } from '@/components/util';
import schema from '@/services/schema';


const NewRecordView = (props) => {
  const { history, match: { params: { modelName: modelNameParam } } } = props;

  const [modelName, setModelName] = useState('');

  useEffect(() => {
    setModelName('');
  }, [modelNameParam]);
  /**
   * After the form is submitted/completed. Handle the corresponding redirect
   */
  const handleSubmit = useCallback((result = null) => {
    if (result) {
      history.push(schema.getLink(result));
    } else {
      history.push('/');
    }
  }, [history]);

  /**
   * Handles the redirect if an error occurs in the child component
   */
  const handleError = useCallback(({ error = {}, content = null }) => {
    const { name, message } = error;

    if (name === 'RecordExistsError' && content) {
      // redirect to the data view page
      const search = qs.stringify(cleanLinkedRecords(content));
      history.push(`/data/table?${search}`, { search, content });
    } else {
      history.push('/error', { error: { name, message } });
    }
  }, [history]);

  return (
    <>
      <ModelSelect
        baseModel={modelNameParam}
        className="record-form__class-select"
        onChange={({ target: { value } }) => setModelName(value)}
        value={modelName}
        variant="radio"
      />
      {modelName
        ? (
          <RecordForm
            modelName={modelName}
            onError={handleError}
            onSubmit={handleSubmit}
            onTopClick={null}
            title={`Create a new ${modelName} Record`}
            variant={FORM_VARIANT.NEW}
          />
        )
        : null
      }
    </>
  );
};

NewRecordView.propTypes = {
  history: propTypes.object.isRequired,
  match: propTypes.object.isRequired,
};


export default NewRecordView;
