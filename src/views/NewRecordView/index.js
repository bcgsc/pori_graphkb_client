import propTypes from 'prop-types';
import * as qs from 'qs';
import React, {
  useCallback, useEffect,
  useState,
} from 'react';

import FormField from '@/components/FormField';
import RecordForm from '@/components/RecordForm';
import { cleanLinkedRecords, FORM_VARIANT } from '@/components/util';
import schema from '@/services/schema';
import handleErrorSaveLocation from '@/services/util';


const NewRecordView = (props) => {
  const { history, match: { path, params: { modelName: modelNameParam } } } = props;

  const [modelName, setModelName] = useState('');
  const [modelOptions, setModelOptions] = useState([]);

  useEffect(() => {
    if (path) {
      try {
        const options = schema.get(modelNameParam || 'V').descendantTree(true).map(m => ({
          label: m.name, value: m.name, key: m.name, caption: m.description,
        }));
        setModelOptions(options);

        if (options.length === 1) {
          setModelName(options[0].label);
        } else {
          setModelName('');
        }
      } catch (err) {
        history.push('/error', { error: { name: err.name, message: err.toString() } });
      }
    }
  }, [path, modelNameParam, history]);


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
      // history.push('/error', { error: { name, message } });
      handleErrorSaveLocation({ name, message }, history);
    }
  }, [history]);

  return (
    <>
      <FormField
        className="record-form__class-select"
        disabled={modelOptions.length < 2}
        model={{
          choices: modelOptions, required: true, name: '@class', type: 'string',
        }}
        onChange={({ target: { value } }) => setModelName(value)}
        value={modelName}
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
