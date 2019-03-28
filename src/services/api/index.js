/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import * as jc from 'json-cycle';
import qs from 'qs';

import kbSchema from '@bcgsc/knowledgebase-schema';

import config from '../../static/config';

import { ApiCall } from './call';
import DataCache from './dataCache';


const {
  API_BASE_URL,
  MIN_WORD_LENGTH,
  DEFAULT_NEIGHBORS,
} = config;

const ID_PROP = '@rid';
const CLASS_PROP = '@class';
const MAX_SUGGESTIONS = 50;
const DEFAULT_LIMIT = 250;


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
    const terms = textInput.split(/\s+/).filter(term => term.length >= MIN_WORD_LENGTH);
    const { excludeClasses = [], ...rest } = opt;

    const ontologyWhere = [{
      operator: 'OR',
      comparisons: terms.map(term => ({ attr: 'name', value: term, operator: 'CONTAINSTEXT' })),
    }];
    if (model.properties.sourceId) {
      ontologyWhere[0].comparisons.push(
        ...terms.map(term => ({ attr: 'sourceId', value: term, operator: 'CONTAINSTEXT' })),
      );
    }

    if (excludeClasses.length) {
      ontologyWhere.push(...excludeClasses.map(
        c => ({ attr: '@class', value: c, negate: true }),
      ));
    }

    const variantWhere = [{
      operator: 'AND',
      comparisons: terms.map(term => ({
        operator: 'OR',
        comparisons: [
          { attr: 'reference1.name', value: term, operator: 'CONTAINSTEXT' },
          { attr: 'reference1.sourceId', value: term },
          { attr: 'reference2.name', value: term, operator: 'CONTAINSTEXT' },
          { attr: 'reference2.sourceId', value: term },
          { attr: 'type.name', value: term, operator: 'CONTAINSTEXT' },
          { attr: 'type.sourceId', value: term },
        ],
      })),
    }];

    let where = ontologyWhere;
    if (model.inherits.includes('Variant') || model.name === 'Variant') {
      where = variantWhere;
    }

    const callOptions = { forceListReturn: true, ...rest };
    let call;
    if (kbSchema.util.looksLikeRID(textInput)) {
      call = get(`${model.routeName}/${textInput}?neighbors=1`, callOptions);
    } else {
      const body = {
        where,
        limit: MAX_SUGGESTIONS,
        neighbors: 1,
      };
      call = post(`${model.routeName}/search`, body, callOptions);
    }
    return call;
  };
  searchHandler.fname = `${model.name}SearchHandler`; // for equality comparisons (for render updates)
  return searchHandler;
};


/**
 * Given the search string from the URL/URI, parse
 * out the content for creating the API request
 *
 * @param {object} opt
 * @param {Schema} opt.schema
 * @param {string} opt.search the search string portion of the URL displayed by this app
 */
const getQueryFromSearch = ({ schema, search }) => {
  const {
    neighbors = DEFAULT_NEIGHBORS,
    limit = DEFAULT_LIMIT,
    keyword,
    complex,
    ...params
  } = qs.parse(search.replace(/^\?/, ''));

  let modelName;
  if (params['@class'] || params.class) {
    modelName = params.class || params['@class'];
    delete params['@class'];
    delete params.class;
  }

  let routeName = schema.get(modelName || 'v')
    ? schema.get(modelName || 'v').routeName
    : null;
  let payload = null;
  let queryParams = null;

  if (complex) {
    // complex encodes the body in the URL so that it can be passed around as a link but still perform a POST search
    routeName += '/search';
    // Decode base64 encoded string.
    payload = JSON.parse(atob(decodeURIComponent(complex)));
    payload.neighbors = Math.max(payload.neighbors || 0, DEFAULT_NEIGHBORS);
    payload.limit = Math.min(payload.limit);
  } else {
    queryParams = {
      limit,
      neighbors: Math.max(neighbors, DEFAULT_NEIGHBORS),
    };
    if (keyword) {
      // keyword search is not associated with a particular model
      routeName = '/search';
      queryParams.keyword = keyword;
    } else {
      queryParams = Object.assign({}, params, queryParams);
    }
  }
  return {
    routeName, queryParams, payload, modelName,
  };
};


/**
 * Given the API search. Return the search string to display in the top URL bar
 *
 * @param {object} opt
 * @param {Schema} opt.schema
 * @param {string} opt.routeName the API route name being queried
 * @param {object} opt.queryParams the query parameters
 * @param {object} opt.payload the body/payload
 */
const getSearchFromQuery = ({
  schema, routeName, queryParams: queryParamsIn = {}, payload = null,
}) => {
  const queryParams = { ...queryParamsIn };
  let modelName;
  if (queryParams) {
    modelName = queryParams.class || queryParams['@class'];
    delete queryParams.class;
    delete queryParams['@class'];
  }
  if (routeName && !modelName) {
    const match = /(\/[^/]+)(\/search)?$/.exec(routeName);
    const { name } = schema.getFromRoute(match[1]);
    modelName = name;
  }
  const alphaSort = (a, b) => a.localeCompare(b);
  if (payload) {
    // complex query
    const complex = btoa(JSON.stringify(payload));
    return qs.stringify({ class: modelName, complex }, { sort: alphaSort });
  } if (!queryParams.keyword) {
    return qs.stringify({ class: modelName, ...queryParams }, { sort: alphaSort });
  }
  return qs.stringify(queryParams, { sort: alphaSort });
};


const querySearchBlock = ({
  search, schema, sortModel, skip, limit, count = false,
}) => {
  const { queryParams, routeName, payload } = getQueryFromSearch({
    schema,
    search,
  });
  const content = payload || queryParams;

  if (count) {
    content.count = true;
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

const recordApiCall = ({ record, schema }) => {
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


export default {
  getNewCache,
  getQueryFromSearch,
  getSearchFromQuery,
  API_BASE_URL,
  CLASS_PROP,
  defaultSuggestionHandler,
  delete: del,
  get,
  ID_PROP,
  patch,
  post,
};
