/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import kbSchema from '@bcgsc-pori/graphkb-schema';
import * as jc from 'json-cycle';
import qs from 'qs';
import { QueryClient } from 'react-query';

import { request } from './call';
import {
  buildSearchFromParseVariant, getQueryFromSearch, getSearchFromQuery,
} from './search';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15m
      refetchOnWindowFocus: false,
      throwOnError: true,
      refetchOnMount: false,
    },
  },
});

const ID_PROP = '@rid';
const CLASS_PROP = '@class';
const MAX_SUGGESTIONS = 50;

/**
 * Sends PATCH request to api.
 * @param {string} endpoint - URL endpoint.
 * @param {Object} payload - PATCH payload.
 */
const patch = (endpoint, payload, callOptions) => {
  // strip out the display name to have it force-regenerate
  const { displayName, ...changes } = payload;
  const init = {
    method: 'PATCH',
    body: jc.stringify(changes),
  };
  return request(endpoint, init, callOptions);
};

/**
 * Sends GET request to api.
 * @param {string} endpoint - URL endpoint.
 */
const get = (endpoint, callOptions) => {
  const init = {
    method: 'GET',
  };
  return request(endpoint, init, callOptions);
};

/**
 * Sends POST request to api.
 * @param {string} endpoint - URL endpoint.
 * @param {Object} payload - POST payload.
 */
const post = (endpoint, payload, callOptions) => {
  const init = {
    method: 'POST',
    body: jc.stringify(payload),
  };
  return request(endpoint, init, callOptions);
};

/**
 * Sends DELETE request to api.
 * @param {string} endpoint - URL endpoint.
 */
const del = (endpoint, callOptions) => {
  const init = {
    method: 'DELETE',
  };

  return request(endpoint, init, callOptions);
};

/**
 * @param {ClassModel} model the schema model to use to generate the search function
 * @returns the function to retrieve the query request body based on some input text
 */
const getDefaultSuggestionQueryBody = model => (textInput) => {
  let body = {};

  if (kbSchema.util.looksLikeRID(textInput)) {
    body = {
      target: [textInput],
    };
    return body;
  }

  body = {
    queryType: 'keyword',
    target: `${model.name}`,
    keyword: textInput,
    limit: MAX_SUGGESTIONS,
    neighbors: 1,
  };

  if (model.inherits.includes('Ontology') || model.name === 'Ontology') {
    body.orderBy = ['source.sort', 'name', 'sourceId'];
  }
  return body;
};

/**
 * encodes complex/payload for POST query request. Returns search with encoded complex.
 *
 * @param {object} content is the payload or query object to be sent with request
 * @param {string} modelName target class that is expected to be returned
 * generated at the top of dataview
 */
const encodeQueryComplexToSearch = (content, modelName = 'V') => {
  const payload = {};
  payload['@class'] = modelName;

  if (content) {
    const stringifiedContent = JSON.stringify(content);
    const base64EncodedContent = btoa(stringifiedContent);
    const encodedContent = encodeURIComponent(base64EncodedContent);
    payload.complex = encodedContent;
  }

  const search = qs.stringify(payload);
  return search;
};

export default {
  encodeQueryComplexToSearch,
  getQueryFromSearch,
  getSearchFromQuery,
  CLASS_PROP,
  delete: del,
  buildSearchFromParseVariant,
  get,
  ID_PROP,
  patch,
  post,
  getDefaultSuggestionQueryBody,
  queryClient,
};
