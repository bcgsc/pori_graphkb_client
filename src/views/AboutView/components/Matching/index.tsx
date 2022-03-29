import './index.scss';

import {
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@material-ui/core';
import { Timeline as TimelineIcon } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useDebounce } from 'use-debounce';

import DetailChip from '@/components/DetailChip';
import DropDownSelect from '@/components/DropDownSelect';
import SearchBox from '@/components/SearchBox';
import { navigateToGraph, tuple } from '@/components/util';
import api from '@/services/api';
import handleErrorSaveLocation from '@/services/util';

const MATCH_LIMIT = 100;

const termTreeQuery = (ontologyClass, term) => ({
  target: {
    target: ontologyClass,
    queryType: 'ancestors',
    filters: { name: term },
  },
  queryType: 'similarTo',
  treeEdges: [],
  returnProperties: [
    '@class',
    'sourceId',
    'sourceIdVersion',
    'deprecated',
    'name',
    '@rid',
    'displayName',
    'source.displayName',
  ],
  limit: MATCH_LIMIT,
});

const equivalentTermsQuery = (ontologyClass, term) => ({
  target: {
    target: ontologyClass,
    queryType: 'descendants',
    filters: { name: term },
  },
  queryType: 'similarTo',
  treeEdges: [],
  returnProperties: [
    '@class',
    'sourceId',
    'sourceIdVersion',
    'deprecated',
    'name',
    '@rid',
    'displayName',
    'source.displayName',
  ],
  limit: MATCH_LIMIT,
});

const exludeRootTermsQuery = (ontologyClass, rootTerm) => ({
  target: {
    target: ontologyClass,
    queryType: 'descendants',
    filters: { name: rootTerm },
  },
  queryType: 'similarTo',
  treeEdges: [],
  returnProperties: [
    '@rid',
  ],
  limit: MATCH_LIMIT,
});

const ROOT_TERM_MAPPING = {
  'copy variant': 'structural variant',
  amplification: 'structural variant',
  'copy gain': 'structural variant',
  'copy loss': 'structural variant',
  'deep deletion': 'structural variant',
  'low level copy gain': 'structural variant',
  'shallow deletion': 'structural variant',
  'increased expression': 'biological',
  'reduced expression': 'biological',
};

const DEBOUNCE_MS = 100;

const MatchView = (props) => {
  const { history } = props;
  const snackbar = useSnackbar();
  const [text, setText] = useState('');
  const [term] = useDebounce(text, DEBOUNCE_MS);
  const [termType, setTermType] = useState('Vocabulary');
  const [rootText, setRootText] = useState('');
  const [rootTerm] = useDebounce(rootText, DEBOUNCE_MS);
  const queryClient = useQueryClient();

  const { data: { hasTooManyRecords, matches = [], isLoading } = {} } = useQuery(
    ['queries', rootTerm, term, termType],
    async () => {
      const queries = [
        termTreeQuery(termType, term),
        equivalentTermsQuery(termType, term),
      ];

      if (rootTerm) {
        queries.push(exludeRootTermsQuery(termType, rootTerm));
      }

      const [treeTerms, parentTerms, excludedParentTerms] = await Promise.all(
        queries.map(async (query) => queryClient.fetchQuery(
          tuple('/query', query),
          async ({ queryKey: [, body] }) => api.query(body),
          { staleTime: Infinity },
          { throwOnError: true },
        )),
      );

      const terms = {};
      treeTerms.forEach((currentTerm) => {
        terms[currentTerm['@rid']] = currentTerm;
      });
      parentTerms.forEach((currentTerm) => {
        terms[currentTerm['@rid']] = currentTerm;
      });

      if (excludedParentTerms) {
        excludedParentTerms.forEach((currentTerm) => {
          delete terms[currentTerm['@rid']];
        });
      }
      return {
        hasTooManyRecords: treeTerms.length >= MATCH_LIMIT || parentTerms.length >= MATCH_LIMIT,
        matches: Object.values(terms),
      };
    },
    {
      onError: (err) => handleErrorSaveLocation(err, history),
    },
  );

  useEffect(() => {
    const normalizedTerm = text.toLowerCase().trim();

    if (ROOT_TERM_MAPPING[normalizedTerm] && rootTerm !== ROOT_TERM_MAPPING[normalizedTerm]) {
      setRootText(ROOT_TERM_MAPPING[normalizedTerm]);
    }
  }, [text, rootTerm]);

  const handleTermTypeChange = ({ target: { value } }) => {
    setRootText('');
    setTermType(value);
  };

  const handleRootTermChange = ({ target: { value } }) => {
    setRootText(value);
  };

  const handleTextChange = useCallback((value) => {
    setRootText('');
    setText(value.trim());
  }, []);

  const handleJumpToGraph = useCallback(() => {
    navigateToGraph(matches.map((m) => m['@rid']), history, (err) => {
      snackbar.enqueueSnackbar(err, { variant: 'error' });
    });
  }, [history, matches, snackbar]);

  let alertText = '';

  if (hasTooManyRecords) {
    alertText = `too many matches; only showing ${matches.length} matched terms`;
  } else if (matches.length) {
    alertText = `matches ${matches.length} terms`;
  } else {
    alertText = 'no matches found; must be an exact match by name';
  }

  return (
    <div className="match-view">
      <Typography className="match-view__title" variant="h2">
        Visualize GraphKB (python) Matching
      </Typography>
      <Typography className="match-view__description" variant="subtitle1">
        Input a term below to display what terms it would match using the GraphKB python adapter.
      </Typography>
      <DropDownSelect
        className="match-view__input"
        label="record class"
        onChange={handleTermTypeChange}
        options={['Disease', 'Vocabulary', 'Therapy']}
        value={termType}
      />
      <TextField
        className="match-view__input"
        disabled
        fullWidth
        helperText="Top level term to match. Exclude parents of this term"
        label="root term"
        onChange={handleRootTermChange}
        value={rootText}
      />
      <SearchBox
        className="match-view__input"
        helperText="Input a term to Match"
        onChange={handleTextChange}
        value={text}
      />
      {text && (isLoading
        ? (<CircularProgress />)
        : (
          <div className="match-view__matches-count-bar">
            <Alert
              className="match-view__matches-alert"
              severity={
                hasTooManyRecords
                  ? 'warning'
                  : 'info'
            }
            >
              {alertText}
            </Alert>
            {matches.length > 0 && (
            <Button
              className="match-view__graph-view"
              data-testid="graph-view"
              onClick={handleJumpToGraph}
              variant="outlined"
            >
              <TimelineIcon
                color="primary"
              />
              Graph View
            </Button>
            )}
          </div>
        ))}

      <div className="match-view__matches">
        {matches.map((match) => (
          <DetailChip
            key={match['@rid']}
            details={{ ...match, source: match.source.displayName }}
            label={`${match.displayName} (${match['@rid']})`}
          />
        ))}
      </div>
    </div>
  );
};

MatchView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default MatchView;
