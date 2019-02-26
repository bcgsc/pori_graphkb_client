/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import * as jc from 'json-cycle';

import util from '../util';
import config from '../../static/config';

import { ApiCall, ApiCallSet } from './call';


const {
  API_BASE_URL,
} = config;
const KB_SEP_CHARS = new RegExp(/[\s:\\;,./+*=!?[\]()]+/, 'gm');

const ID_PROP = '@rid';
const CLASS_PROP = '@class';


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

export default {
  get,
  post,
  delete: del,
  patch,
  autoSearch,
  API_BASE_URL,
  submitEdges,
  patchEdges,
};
