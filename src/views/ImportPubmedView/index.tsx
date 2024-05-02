import './index.scss';

import {
  CircularProgress,
  Typography,
} from '@material-ui/core';
import { titleCase } from 'change-case';
import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { tuple } from '@/components/util';
import util from '@/services/util';

import SearchBox from '../../components/SearchBox';
import api from '../../services/api';
import PubmedCard from './components/PubmedCard';

const ImportPubmedView = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const snackbar = useSnackbar();
  const [errorText, setErrorText] = useState('');
  const [text, setText] = useState('');
  const [pmid] = useDebounce(text, 1000);

  // fetch the pubmed source record
  const { data: source } = useQuery(
    tuple('/query', { target: 'Source', filters: { name: 'pubmed' } }),
    async ({ queryKey: [, body] }) => api.query(body),
    {
      onError: (err) => util.handleErrorSaveLocation(err, {
        navigate,
        pathname,
        search: searchParams.toString(),
      }),
      select: (response) => response[0]?.['@rid'],
    },
  );

  // fetch records that already exist in GraphKB
  const { data: currentRecords, isLoading, refetch: refetchCurrentRecords } = useQuery(
    tuple(
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
    async ({ queryKey: [, body] }) => api.query(body),
    {
      enabled: Boolean(text),
      onError: (err) => util.handleErrorSaveLocation(err, {
        navigate,
        pathname,
        search: searchParams.toString(),
      }),
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
          util.handleErrorSaveLocation(err, {
            navigate,
            pathname,
            search: searchParams.toString(),
          });
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
      {currentRecords?.map((rec) => (
        <PubmedCard
          key={rec['@rid'] as string}
          journalName={rec.journalName as string}
          recordId={rec['@rid'] as string}
          sourceId={rec.sourceId as string}
          title={titleCase(rec.name as string)}
        />
      ))}
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
