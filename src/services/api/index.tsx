/**
 * Wrapper for api, handles all requests and special functions.
 */
import { util, schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import * as jc from 'json-cycle';
import qs from 'qs';
import { QueryClient } from 'react-query';

import { GeneralRecordType, QueryBody } from '@/components/types';

import { request, RequestCallOptions } from './call';
import {
  getQueryFromSearch, getSearchFromQuery,
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
 * @param endpoint - URL endpoint.
 * @param {Object} payload - PATCH payload.
 */
const patch = (endpoint: string, payload: Record<string, unknown>): Promise<GeneralRecordType> => {
  const init = {
    method: 'PATCH',
    body: jc.stringify(payload),
  };
  return request(endpoint, init);
};

/**
 * Sends GET request to api.
 * @param {string} endpoint - URL endpoint.
 */
const get = (endpoint: string, callOptions?: RequestCallOptions) => {
  const init = {
    method: 'GET',
  };
  return request(endpoint, init, callOptions);
};

/**
 * Sends POST request to api to create a new record.
 * @param {string} endpoint - URL endpoint.
 * @param {Object} payload - POST payload.
 */
function post<Resp = GeneralRecordType>(endpoint: string, payload?: Record<string, unknown>): Promise<Resp> {
  const init = {
    method: 'POST',
    body: jc.stringify(payload),
  };
  return request(endpoint, init);
}

/**
 * Sends POST request to api to the query endpoint
 * @param {Object} payload - POST payload.
 */
function query<ReqFields extends string = string, Record = GeneralRecordType<ReqFields>>(
  payload: QueryBody<ReqFields>,
): Promise<Record[]> {
  const init = {
    method: 'POST',
    body: jc.stringify(payload),
  };
  return request('/query', init);
}

/**
 * Sends POST request to token endpoint to get gkb token
 * @param keyCloakToken - keycloak token
 */
function authenticate(keyCloakToken: string | undefined): Promise<{ kbToken: string }> {
  const init = {
    method: 'POST',
    body: jc.stringify({ keyCloakToken }),
  };
  return request('/token', init);
}

/**
 * Sends DELETE request to api.
 * @param {string} endpoint - URL endpoint.
 */
const del = (endpoint: string) => {
  const init = {
    method: 'DELETE',
  };

  return request(endpoint, init);
};

/**
 * @param {ClassModel} model the schema model to use to generate the search function
 * @returns the function to retrieve the query request body based on some input text
 */
const getDefaultSuggestionQueryBody = (model) => (textInput) => {
  let body: Record<string, unknown> = {};

  if (util.looksLikeRID(textInput)) {
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
  if (model && model.name && schemaDefn.children(model.name) && schemaDefn.children(model.name).includes('Ontology') || model.name === 'Ontology') {
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
  const payload: Record<string, unknown> = {};
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
  get,
  ID_PROP,
  patch,
  post,
  getDefaultSuggestionQueryBody,
  queryClient,
  query,
  authenticate,
};
