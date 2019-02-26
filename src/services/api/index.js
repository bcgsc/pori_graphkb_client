/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import * as jc from 'json-cycle';

import kbSchema from '@bcgsc/knowledgebase-schema';

import util from '../util';
import config from '../../static/config';

import { ApiCall, ApiCallSet } from './call';


const {
  API_BASE_URL,
} = config;
const KB_SEP_CHARS = new RegExp(/[\s:\\;,./+*=!?[\]()]+/, 'gm');

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
 * Wrapper for autosearch method.
 * @param {string} endpoint - URL endpoint.
 * @param {Array.<string>} property - Property to query.
 * @param {string} value - Query input string.
 * @param {number} limit - Limit for number of returned matches.
 */
const autoSearch = (endpoint, property, value, limit, callOptions) => {
  if (!value || !value.trim()) return { result: [] };

  // Matches Knowledgebase api separator characters
  const literalRe = new RegExp(/^['"].*['"]$/);
  const m = !!(value.split(KB_SEP_CHARS).some(chunk => chunk.length < 4));

  const orStr = property.length > 1 ? `or=${property.join(',')}` : '';
  let extras = `limit=${limit}&neighbors=1`;
  let query;

  if (value.match(literalRe)) {
    query = property
      .map(p => `${p}=${encodeURIComponent(value.slice(1, value.length - 1).trim())}`)
      .join('&');
  } else {
    query = property
      .map(p => `${p}=${!m ? '~' : ''}${encodeURIComponent(value.trim())}`)
      .join('&');
    extras += '&@class=!Publication';
  }

  return get(`/${endpoint}?${query}${orStr && `&${orStr}`}&${extras}`, callOptions);
};

/**
 * Replaces placeholder RIDs and posts a list of edges.
 * @param {Array.<Object>} edges - new edges to post.
 * @param {Object} schema - Knowledgebase db schema.
 * @param {string} [rid=''] - Record id to post edges to.
 */
const submitEdges = (edges, schema, rid = '', callOptions) => {
  const newEdges = new ApiCallSet();
  for (let i = 0; i < edges.length; i += 1) {
    const properties = schema.getProperties(edges[i][CLASS_PROP]);
    const edge = util.parsePayload(edges[i], properties);
    if (edge.in === '#node_rid') {
      edge.in = rid;
    } else if (edge.out === '#node_rid') {
      edge.out = rid;
    }

    newEdges.push(post(schema.get(edges[i][CLASS_PROP]).routeName, edge, callOptions));
  }
  return newEdges;
};

/**
 * Calculates difference in edges and posts/deletes them.
 * @param {Array} originalEdges - list of original relationshps
 * @param {Array} newEdges - list of current relationships
 * @param {Object} schema - Knowledgebase db schema.
 */
const patchEdges = (originalEdges, newEdges, schema, callOptions) => {
  const changedEdges = new ApiCallSet();
  /* Checks for differences in original node and submitted form. */

  // Deletes edges that are no longer present on the edited node.
  originalEdges.forEach((edge) => {
    const matched = newEdges.find(r => r[ID_PROP] === edge[ID_PROP]);
    if (!matched || matched.deleted) {
      const { routeName } = schema.get(edge[CLASS_PROP]);
      changedEdges.push(del(
        `${routeName}/${edge[ID_PROP].slice(1)}`,
        callOptions,
      ));
    }
  });

  // Adds new edges that were not present on the original node.
  newEdges.forEach((relationship) => {
    if (!originalEdges.find(r => r[ID_PROP] === relationship[ID_PROP])) {
      const properties = schema.getProperties(relationship[CLASS_PROP]);
      const route = schema.getRoute(relationship[CLASS_PROP]);
      const payload = util.parsePayload(relationship, properties);
      changedEdges.push(post(route, payload, callOptions));
    }
  });

  return changedEdges;
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
const defaultSuggestionHandler = (model, opt = {}) => (textInput) => {
  const terms = textInput.split(/\s+/).filter(term => term.length >= 4);
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
    call = get(`${model.routeName}/${textInput}`, callOptions);
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


export default {
  API_BASE_URL,
  autoSearch,
  CLASS_PROP,
  defaultSuggestionHandler,
  delete: del,
  get,
  ID_PROP,
  patch,
  patchEdges,
  post,
  submitEdges,
};
