/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import * as jc from 'json-cycle';
import qs from 'qs';

import kbSchema from '@bcgsc/knowledgebase-schema';
import kbp from '@bcgsc/knowledgebase-parser';

import config from '../../static/config';

import { ApiCall } from './call';
import DataCache from './dataCache';
import {
  getQueryFromSearch, buildSearchFromParseVariant, getSearchFromQuery,
} from './search';
import schema from '../schema';


const {
  API_BASE_URL,
  DEFAULT_NEIGHBORS,
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
  const init = {
    method: 'PATCH',
    body: jc.stringify(payload),
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
    if (model.inherits.includes('Variant') || model.name === 'Variant') {
      try {
        const parsed = kbp.variant.parse(textInput);
        body = {
          ...buildSearchFromParseVariant(schema, parsed),
          limit: MAX_SUGGESTIONS,
          neighbors: 1,
        };
        return post('/query', body, callOptions);
      } catch (err) {
        console.error(err);
        // assume it was not hgvs if the parser fails
      }
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
 * @typedef {Object} SortModel
 *
 * @property {string} colId the column being sorted on
 * @property {string} sort the direction to sort by (asc or desc)
 */


/**
 * Create an API call for retrieving a block/page of rows/records
 *
 * @param {object} opt
 * @param {string} opt.search the query string
 * @param {Schema} opt.schema
 * @param {Array.<SortModel>} opt.sortModel the sort model
 * @param {number} opt.skip the number of records to skip on return
 * @param {number} opt.limit the maximum number of records to return
 * @param {boolean} opt.count count the records instead of returning them
 *
 * @returns {ApiCall} the api call for retriving the requested data
 */
const querySearchBlock = ({
  search, sortModel, skip, limit, count = false,
}) => {
  const { queryParams, routeName, payload } = getQueryFromSearch({
    schema,
    search,
    count,
  });
  const content = payload || queryParams;

  if (count) {
    content.count = true;
    delete content.neighbors;
  } else {
    content.skip = skip;
    content.limit = limit;

    if (sortModel.length) {
      const [{ colId: orderBy, sort: orderByDirection }] = sortModel;
      content.orderBy = orderBy;
      content.orderByDirection = orderByDirection.toUpperCase();
    }
  }

  let call;

  if (payload) {
    call = post(routeName, payload);
  } else {
    call = get(`${routeName}?${qs.stringify(queryParams)}`);
  }
  return call;
};


/**
 * Grab an individual record
 *
 * @param {object} opt
 * @param {object|string} opt.record the record or record ID
 * @param {Schema} opt.schema
 *
 * @returns {ApiCall} the api call for retriving the requested data
 */
const recordApiCall = ({ record }) => {
  const { '@rid': rid = record } = record;
  const { routeName = '/v' } = schema.get(record) || {};
  return get(`${routeName}/${rid.slice(1)}?neighbors=${DEFAULT_NEIGHBORS}`);
};


const getNewCache = (opt) => {
  const cache = new DataCache({
    ...opt,
    recordApiCall,
    blockApiCall: querySearchBlock,
  });
  return cache;
};

/**
 * encodes complex/payload for POST query request. Returns search with encoded complex.
 *
 * @param {object} content is the payload or query object to be sent with request
 * @param {string} modelName target class that is expected to be returned
 */
const encodeQueryComplexToSearch = (content, modelName = 'V') => {
  const stringifiedContent = JSON.stringify(content);
  const base64EncodedContent = btoa(stringifiedContent);
  const encodedContent = encodeURIComponent(base64EncodedContent);

  const payload = {};
  payload.complex = encodedContent;
  payload['@class'] = modelName;
  const search = qs.stringify(payload);
  return search;
};


export default {
  encodeQueryComplexToSearch,
  getNewCache,
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
