import './index.scss';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import {
  Typography,
} from '@material-ui/core';
import { titleCase } from 'change-case';
import PropTypes from 'prop-types';
import React, {
  useCallback, useContext,
  useEffect, useRef, useState,
} from 'react';

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
  const snackbar = useContext(SnackbarContext);
  const [errorText, setErrorText] = useState('');
  const [pmid, setPmid] = useState('');

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
      if (pmid) {
        call = createPubmedQuery(pmid);

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
  }, [history, pmid]);

  useEffect(() => {
    controllers.current.forEach(c => c && c.abort());
  }, []);

  // fetch records that do not already exist in GraphKB
  const handleImport = useCallback(async () => {
    if (pmid && currentRecords && currentRecords.length === 0) {
      try {
        const call = api.get(`/extensions/pubmed/${pmid}`);
        controllers.current.push(call);
        const record = await call.request();
        const newCall = api.post('/publications', { ...record, source });
        controllers.current.push(newCall);
        const result = await newCall.request();
        snackbar.add(`created the new publication record ${result['@rid']}`);
        setCurrentRecords([result]);
      } catch (err) {
        handleErrorSaveLocation(err, history);
      }
    }
  }, [pmid, currentRecords, source, snackbar, history]);

  const handleTextChange = (value) => {
    if (/^\d*$/.exec(`${value}`)) {
      setErrorText('');
      setPmid(value);
    } else {
      setErrorText('PubMed IDs must be only numbers');
    }
  };

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
        value={pmid}
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
      {(!currentRecords || !currentRecords.length) && pmid && (
        <PubmedCard
          key={pmid}
          onClick={handleImport}
          sourceId={pmid}
        />
      )}
    </div>
  );
};

ImportPubmedView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default ImportPubmedView;
