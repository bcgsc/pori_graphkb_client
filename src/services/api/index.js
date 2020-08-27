/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import kbp from '@bcgsc/knowledgebase-parser';
import kbSchema from '@bcgsc/knowledgebase-schema';
import * as jc from 'json-cycle';
import qs from 'qs';

import config from '@/static/config';

import schema from '../schema';
import { ApiCall } from './call';
import {
  buildSearchFromParseVariant, getQueryFromSearch, getSearchFromQuery,
} from './search';


const {
  API_BASE_URL,
} = config;

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
  return new ApiCall(endpoint, init, callOptions);
};

/**
 * Sends GET request to api.
 * @param {string} endpoint - URL endpoint.
 */
const get = (endpoint, callOptions) => {
  const init = {
    method: 'GET',
  };
  return new ApiCall(endpoint, init, callOptions);
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
  return new ApiCall(endpoint, init, callOptions);
};

/**
 * Sends DELETE request to api.
 * @param {string} endpoint - URL endpoint.
 */
const del = (endpoint, callOptions) => {
  const init = {
    method: 'DELETE',
  };

  return new ApiCall(endpoint, init, callOptions);
};


/**
 * @typedef {function} searchHandlerRequest
 * @param {string} searchTermValue the term to search for
 * @returns {Array.<object>|object} the record or list of records suggested
 */

/**
 * @typedef {object} searchHandler
 * @property {function} abort aborts the current fetch request
 * @property {searchHandlerRequest} request the asynchronous call to fetch the data
 */

/**
 * @param {ClassModel} model the schema model to use to generate the search function
 * @returns {searchHandler} the function to retrieve the sugesstions based on some input text
 */
const defaultSuggestionHandler = (model, opt = {}) => {
  const searchHandler = (textInput) => {
    const { ...rest } = opt;

    const callOptions = { forceListReturn: true, ...rest };
    let body = {};

    if (kbSchema.util.looksLikeRID(textInput)) {
      body = {
        target: [textInput],
      };
      return post('/query', body, callOptions);
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
    return post('/query', body, callOptions);
  };
  searchHandler.fname = `${model.name}SearchHandler`; // for equality comparisons (for render updates)
  return searchHandler;
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
  API_BASE_URL,
  CLASS_PROP,
  defaultSuggestionHandler,
  delete: del,
  buildSearchFromParseVariant,
  get,
  ID_PROP,
  patch,
  post,
};
