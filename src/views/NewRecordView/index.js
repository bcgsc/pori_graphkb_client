import './index.scss';

import propTypes from 'prop-types';
import * as qs from 'qs';
import React, {
  useCallback,
} from 'react';

import RecordForm from '@/components/RecordForm';
import { cleanLinkedRecords, FORM_VARIANT } from '@/components/util';
import schema from '@/services/schema';
import handleErrorSaveLocation from '@/services/util';

import NewVariant from './components/NewVariant';

const VARIANT_CLASSES = ['variant', 'positionalvariant', 'categoryvariant'];

const NewRecordView = (props) => {
  const {
    history,
    match: {
      params: { modelName },
    },
  } = props;

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
      handleErrorSaveLocation({ name, message }, history);
    }
  }, [history]);

  let innerComponent = null;

  if (
    VARIANT_CLASSES.includes(modelName.toLowerCase())
    || (modelName && VARIANT_CLASSES.includes(modelName.toLowerCase()))
  ) {
    innerComponent = (
      <NewVariant
        onError={handleError}
        onSubmit={handleSubmit}
      />
    );
  } else {
    innerComponent = (
      <RecordForm
        modelName={modelName}
        onError={handleError}
        onSubmit={handleSubmit}
        onTopClick={null}
        title={`Create a new ${modelName} Record`}
        variant={FORM_VARIANT.NEW}
      />
    );
  }
  return (
    <div className="new-record-view">{innerComponent}</div>
  );
};

NewRecordView.propTypes = {
  history: propTypes.object.isRequired,
  match: propTypes.object.isRequired,
};


export default NewRecordView;
