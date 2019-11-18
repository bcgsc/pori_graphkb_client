import React, {
  useState, useCallback, useEffect,
} from 'react';
import * as qs from 'qs';
import propTypes from 'prop-types';

import RecordForm from '@/components/RecordForm';
import FormField from '@/components/RecordForm/FormField';
import { FORM_VARIANT } from '@/components/RecordForm/util';
import { cleanLinkedRecords } from '@/components/util';
import schema from '@/services/schema';


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
      history.push('/error', { error: { name, message } });
    }
  }, [history]);

  return (
    <>
      <FormField
        model={{
          choices: modelOptions, required: true, name: '@class', type: 'string',
        }}
        value={modelName}
        onChange={({ target: { value } }) => setModelName(value)}
        disabled={modelOptions.length < 2}
        className="record-form__class-select"
      />
      {modelName
        ? (
          <RecordForm
            variant={FORM_VARIANT.NEW}
            modelName={modelName}
            title={`Create a new ${modelName} Record`}
            onTopClick={null}
            onSubmit={handleSubmit}
            onError={handleError}
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
