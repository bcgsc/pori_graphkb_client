import './index.scss';

import {
  CircularProgress,
  Typography,
} from '@material-ui/core';
import { titleCase } from 'change-case';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect, useRef, useState,
} from 'react';
import { useDebounce } from 'use-debounce';

import handleErrorSaveLocation from '@/services/util';

import SearchBox from '../../components/SearchBox';
import api from '../../services/api';
import PubmedCard from './components/PubmedCard';


const createPubmedQuery = pmid => api.post('/query', {
  target: 'Publication',
  filters: {
    AND: [
      {
        source: {
          target: 'Source',
          filters: { name: 'pubmed' },
        },
      },
      { sourceId: pmid },
    ],
  },
});


const ImportPubmedView = (props) => {
  const { history } = props;
  const snackbar = useSnackbar();
  const [errorText, setErrorText] = useState('');
  const [text, setText] = useState('');
  const [externalRecord, setExternalRecord] = useState(null);
  const [pmid] = useDebounce(text, 1000);
  const [isLoading, setIsLoading] = useState(false);

  const [currentRecords, setCurrentRecords] = useState([]);
  const [source, setSource] = useState('');

  const controllers = useRef([]);

  // fetch the pubmed source record
  useEffect(() => {
    let call;

    const fetchRecord = async () => {
      call = api.post('/query', { target: 'Source', filters: { name: 'pubmed' } });

      try {
        const [record] = await call.request();
        setSource(record['@rid']);
      } catch (err) {
        handleErrorSaveLocation(err, history);
      }
    };

    fetchRecord();

    return () => call && call.abort();
  }, [history]);

  // fetch records that already exist in GraphKB
  useEffect(() => {
    let call;

    const fetchRecords = async () => {
      if (text) {
        call = createPubmedQuery(text);

        try {
          const records = await call.request();
          setCurrentRecords(records);
        } catch (err) {
          handleErrorSaveLocation(err, history);
        }
      }
    };

    fetchRecords();

    return () => call && call.abort();
  }, [history, text]);

  // fetch details from PUBMED
  useEffect(() => {
    const getContent = async () => {
      const call = api.get(`/extensions/pubmed/${pmid}`);
      controllers.current.push(call);
      const record = await call.request();
      setExternalRecord(record);
      setIsLoading(false);
    };
    getContent();
  }, [pmid]);


  useEffect(() => {
    controllers.current.forEach(c => c && c.abort());
  }, []);

  // fetch records that do not already exist in GraphKB
  const handleImport = useCallback(async () => {
    if (externalRecord) {
      try {
        const newCall = api.post('/publications', { ...externalRecord, source });
        controllers.current.push(newCall);
        const result = await newCall.request();
        snackbar.enqueueSnackbar(`created the new publication record ${result['@rid']}`);
        setCurrentRecords([result]);
      } catch (err) {
        handleErrorSaveLocation(err, history);
      }
    }
  }, [externalRecord, source, snackbar, history]);

  const handleTextChange = useCallback((value) => {
    if (text) {
      setIsLoading(true);
    }
    setExternalRecord(null);

    if (/^\d*$/.exec(`${value}`)) {
      setErrorText('');
      setText(value);
    } else {
      setErrorText('PubMed IDs must be only numbers');
    }
  }, [text]);

  return (
    <div className="import-view">
      <Typography className="import-view__title" variant="h1">
        Import PubMed Articles to GraphKB
      </Typography>
      <SearchBox
        className="import-view__search-box"
        error={Boolean(errorText)}
        helperText={errorText}
        onChange={handleTextChange}
        placeholder="Enter a PubMed ID ex. 1234"
        value={text}
      />
      {currentRecords.map(rec => (
        <PubmedCard
          key={rec['@rid']}
          abstract={rec.description}
          journalName={rec.journalName}
          recordId={rec['@rid']}
          sourceId={rec.sourceId}
          title={titleCase(rec.name)}
        />
      ))}
      {isLoading && <CircularProgress className="import-view__progress" />}
      {(!currentRecords || !currentRecords.length) && externalRecord && (
        <PubmedCard
          key={text}
          abstract={externalRecord.description}
          journalName={externalRecord.journalName}
          onClick={handleImport}
          sourceId={text}
          title={titleCase(externalRecord.name)}

        />
      )}
    </div>
  );
};

ImportPubmedView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default ImportPubmedView;
