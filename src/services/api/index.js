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
  TABLE_DEFAULT_NEIGHBORS,
  DEFAULT_NEIGHBORS,
} = config;

const ID_PROP = '@rid';
const CLASS_PROP = '@class';
const MAX_SUGGESTIONS = 50;
const DEFAULT_LIMIT = 100;
const MIN_WORD_LENGTH = 3;


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
    let terms = textInput.split(/\s+/);
    let operator = 'CONTAINSTEXT';

    if (terms.length > 1) {
      terms = terms.filter(term => term.length >= MIN_WORD_LENGTH);
    } else if (terms.length === 1 && terms[0].length < MIN_WORD_LENGTH) {
      operator = '=';
    }

    const { ...rest } = opt;


    const ontologyFilters = {
      OR: terms.map(term => ({ name: term, operator })),
    };

    if (model.properties.sourceId) {
      ontologyFilters.OR.push(
        ...terms.map(term => ({ sourceId: term, operator })),
      );
    }

    const variantBody = {
      queryType: 'keyword',
      target: 'Variant',
      keyword: terms.join(),
    };

    const callOptions = { forceListReturn: true, ...rest };
    let body;
    let call;

    if (kbSchema.util.looksLikeRID(textInput)) {
      body = {
        target: [textInput],
      };
    } else {
      body = {
        target: `${model.name}`,
        filters: ontologyFilters,
        limit: MAX_SUGGESTIONS,
      };

      if (model.inherits.includes('Variant') || model.name === 'Variant') {
        body = variantBody;
      }

      if (model.inherits.includes('Ontology') || model.name === 'Ontology') {
        body.orderBy = ['name', 'sourceId'];
      }
      call = post('/query', body, callOptions);
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
const getQueryFromSearch = ({ schema, search, count }) => {
  const {
    neighbors = TABLE_DEFAULT_NEIGHBORS,
    limit = DEFAULT_LIMIT,
    keyword,
    complex,
    ...params
  } = qs.parse(search.replace(/^\?/, ''));

  let modelName = 'v';

  if (params['@class'] || params.class) {
    // to make URL more readable class is sometimes used in place of @class
    // these are used to determine the route name and should not also appear as query params
    modelName = params.class || params['@class'];
    delete params['@class'];
    delete params.class;
  }

  if (!schema.get(modelName)) {
    throw new Error(`Failed to find the expected model (${modelName})`);
  }
  let { routeName } = schema.get(modelName);

  let payload = null;
  let queryParams = null;

  if (complex) {
    // complex encodes the body in the URL so that it can be passed around as a link but still perform a POST search
    routeName += '/search';
    // Decode base64 encoded string.
    payload = JSON.parse(atob(decodeURIComponent(complex)));
    payload.neighbors = Math.max(payload.neighbors || 0, TABLE_DEFAULT_NEIGHBORS);
    payload.limit = Math.min(payload.limit || DEFAULT_LIMIT);
  } else {
    queryParams = {
      limit,
      neighbors: count ? 0 : Math.max(neighbors, TABLE_DEFAULT_NEIGHBORS),
    };

    if (keyword) {
      // keyword search is only associated with statements
      routeName = '/statements/search';
      modelName = 'Statement';
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
    // to make URL more readable class is sometimes used in place of @class
    // these are used to determine the route name and should not also appear as query params
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
  search, schema, sortModel, skip, limit, count = false,
}) => {
  const { queryParams, routeName, payload } = getQueryFromSearch({
    schema,
    search,
    count,
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


/**
 * Grab an individual record
 *
 * @param {object} opt
 * @param {object|string} opt.record the record or record ID
 * @param {Schema} opt.schema
 *
 * @returns {ApiCall} the api call for retriving the requested data
 */
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
