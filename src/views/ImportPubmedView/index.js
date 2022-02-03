import './index.scss';

import {
  CircularProgress,
  Typography,
} from '@material-ui/core';
import { titleCase } from 'change-case';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useDebounce } from 'use-debounce';

import handleErrorSaveLocation from '@/services/util';

import SearchBox from '../../components/SearchBox';
import api from '../../services/api';
import PubmedCard from './components/PubmedCard';


const ImportPubmedView = (props) => {
  const { history } = props;
  const snackbar = useSnackbar();
  const [errorText, setErrorText] = useState('');
  const [text, setText] = useState('');
  const [pmid] = useDebounce(text, 1000);

  // fetch the pubmed source record
  const { data: source } = useQuery(
    ['/query', { target: 'Source', filters: { name: 'pubmed' } }],
    ({ queryKey: [route, body] }) => api.post(route, body),
    {
      onError: err => handleErrorSaveLocation(err, history),
      select: response => response['@rid'],
    },
  );

  // fetch records that already exist in GraphKB
  const { data: currentRecords, isLoading, refetch: refetchCurrentRecords } = useQuery(
    [
      '/query',
      {
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
      },
    ],
    ({ queryKey: [route, body] }) => api.post(route, body),
    {
      enabled: Boolean(text),
      onError: err => handleErrorSaveLocation(err, history),
    },
  );

  // fetch details from PUBMED
  const { data: externalRecord = null } = useQuery(
    `/extensions/pubmed/${pmid}`,
    ({ queryKey: [route] }) => api.get(route),
    {
      enabled: Boolean(pmid),
    },
  );

  const { mutate: importRecord, isLoading: isImporting } = useMutation(
    async () => {
      if (externalRecord) {
        try {
          const result = await api.post('/publications', { ...externalRecord, source });
          snackbar.enqueueSnackbar(`created the new publication record ${result['@rid']}`, { variant: 'success' });
          refetchCurrentRecords();
        } catch (err) {
          handleErrorSaveLocation(err, history);
        }
      }
    },
  );

  // fetch records that do not already exist in GraphKB
  const handleImport = useCallback(async () => importRecord(), [importRecord]);

  const handleTextChange = useCallback((value) => {
    if (/^\d*$/.exec(`${value}`)) {
      setErrorText('');
      setText(value);
    } else {
      setErrorText('PubMed IDs must be only numbers');
    }
  }, []);

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
      {(isImporting || isLoading) && <CircularProgress className="import-view__progress" />}
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
