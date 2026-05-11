import './index.scss';

import {
  CircularProgress,
  Typography,
} from '@mui/material';
import { titleCase } from 'change-case';
import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useDebounce } from 'use-debounce';

import { tuple } from '@/components/util';
import { ErrorMessage } from '@/services/errors';

import SearchBox from '../../components/SearchBox';
import api from '../../services/api';
import PubmedCard from './components/PubmedCard';

const ImportPubmedView = () => {
  const snackbar = useSnackbar();
  const [errorText, setErrorText] = useState('');
  const [text, setText] = useState('');
  const [pmid] = useDebounce(text, 1000);

  // fetch the pubmed source record
  const { data: source, error: sourceError } = useQuery({
    queryKey: tuple('/query', { target: 'Source', filters: { name: 'pubmed' } }),
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
    select: (response) => response[0]?.['@rid'],
  });

  // fetch records that already exist in GraphKB
  const {
    data: currentRecords, isLoading, refetch: refetchCurrentRecords, error,
  } = useQuery({
    queryKey: tuple(
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
    ),
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
    enabled: Boolean(text),
  });

  // fetch details from PUBMED
  const { data: externalRecord = null } = useQuery({
    queryKey: [`/extensions/pubmed/${pmid}`],
    queryFn: ({ queryKey: [route] }) => api.get(route),
    enabled: Boolean(pmid),
  });

  const { mutate: importRecord, isPending: isImporting, error: importError } = useMutation({
    mutationFn: async () => {
      if (externalRecord) {
        const result = await api.post('/publications', { ...externalRecord, source });
        snackbar.enqueueSnackbar(`created the new publication record ${result['@rid']}`, { variant: 'success' });
        refetchCurrentRecords();
      }
    },
  });

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
      {currentRecords?.map((rec) => (
        <PubmedCard
          key={rec['@rid'] as string}
          journalName={rec.journalName as string}
          recordId={rec['@rid'] as string}
          sourceId={rec.sourceId as string}
          title={titleCase(rec.name as string)}
        />
      ))}
      <ErrorMessage error={error || sourceError}>An error occurred loading records.</ErrorMessage>
      <ErrorMessage error={importError}>An error occurred importing records.</ErrorMessage>
      {(isImporting || isLoading) && <CircularProgress className="import-view__progress" />}
      {(!currentRecords || !currentRecords.length) && externalRecord && (
        <PubmedCard
          key={text}
          journalName={externalRecord.journalName}
          onClick={handleImport}
          sourceId={text}
          title={titleCase(externalRecord.name)}
        />
      )}
    </div>
  );
};

export default ImportPubmedView;
