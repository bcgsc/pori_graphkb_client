/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import * as jc from 'json-cycle';
import auth from './auth';
import util from './util';
import config from '../static/config';
import history from './history';

const {
  API_BASE_URL,
} = config;
const KB_SEP_CHARS = new RegExp(/[\s:\\;,./+*=!?[\]()]+/, 'gm');

/**
 * Appends global headers to outgoing request.
 */
const getHeaders = () => {
  const headers = new Headers();
  headers.append('Content-type', 'application/json');
  if (auth.getToken()) {
    headers.append('Authorization', auth.getToken());
  }
  return headers;
};

/**
 * Sends request to server, appending all global headers and handling responses and errors.
 * @param {string} endpoint - URL endpoint
 * @param {Object} init - Request properties.
 */
const fetchWithInterceptors = async (endpoint, init) => {
  try {
    const initWithInterceptors = {
      ...init,
      headers: getHeaders(),
    };
    const request = new Request(API_BASE_URL + endpoint, initWithInterceptors);
    const response = await fetch(request);
    if (response.ok) {
      return response.json();
    }

    const error = {
      ...(await response.json()),
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    };
    if (response.status === 401) {
      let state = {};
      if (auth.isExpired()) {
        state = { timedout: true };
      }
      auth.clearToken();
      if (history.location.pathname !== '/login') {
        history.push({ pathname: '/login', state });
        return Promise.reject('Unauthorized, redirecting...');
      }
      return Promise.reject(error);
    }
    if (response.status === 400) {
      history.push({ pathname: '/query/advanced', state: error });
      return Promise.reject('Invalid Query');
    }
    history.push({ pathname: '/error', state: error });
    return Promise.reject('Unexpected Error, redirecting...');
  } catch (error) {
    history.push({
      pathname: '/error',
      state: {
        message: error.message,
        url: API_BASE_URL,
        statusText: 'Fetch',
      },
    });
    throw new Error('Unexpected Error, redirecting...');
  }
};

/**
 * Sends PATCH request to api.
 * @param {string} endpoint - URL endpoint.
 * @param {Object} payload - PATCH payload.
 */
const patch = (endpoint, payload) => {
  const init = {
    method: 'PATCH',
    body: jc.stringify(payload),
  };
  return fetchWithInterceptors(endpoint, init);
};

/**
 * Sends GET request to api.
 * @param {string} endpoint - URL endpoint.
 */
const get = (endpoint) => {
  const init = {
    method: 'GET',
  };
  return fetchWithInterceptors(endpoint, init);
};

/**
 * Sends POST request to api.
 * @param {string} endpoint - URL endpoint.
 * @param {Object} payload - POST payload.
 */
const post = (endpoint, payload) => {
  const init = {
    method: 'POST',
    body: jc.stringify(payload),
  };

  return fetchWithInterceptors(endpoint, init);
};

/**
 * Sends DELETE request to api.
 * @param {string} endpoint - URL endpoint.
 */
const del = (endpoint) => {
  const init = {
    method: 'DELETE',
  };

  return fetchWithInterceptors(endpoint, init);
};

/**
 * Wrapper for autosearch method.
 * @param {string} endpoint - URL endpoint.
 * @param {string} property - Property to query.
 * @param {string} value - Query input string.
 * @param {number} limit - Limit for number of returned matches.
 */
const autoSearch = (endpoint, property, value, limit) => {
  if (!value || !value.trim()) return { result: [] };

  // Matches Knowledgebase api separator characters
  const literalRe = new RegExp(/^['"].*['"]$/);
  const m = !!(value.split(KB_SEP_CHARS).some(chunk => chunk.length < 4));

  const orStr = `or=${property.join(',')}`;
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

  return get(`${endpoint}?${query}&${orStr}&${extras}`);
};

/**
 * Replaces placeholder RIDs and posts a list of edges.
 * @param {Array.<Object>} edges - new edges to post.
 * @param {Object} schema - Knowledgebase db schema.
 * @param {string} [rid=''] - Record id to post edges to.
 */
const submitEdges = (edges, schema, rid = '') => {
  const newEdges = [];
  for (let i = 0; i < edges.length; i += 1) {
    const properties = schema.getProperties(edges[i]['@class']);
    const edge = util.parsePayload(edges[i], properties);
    if (edge.in === '#node_rid') {
      edge.in = rid;
    } else if (edge.out === '#node_rid') {
      edge.out = rid;
    }

    newEdges.push(post(schema[edges[i]['@class']].routeName, edge));
  }
  return Promise.all(newEdges);
};

/**
 * Calculates difference in edges and posts/deletes them.
 * @param {Array} originalEdges - list of original relationshps
 * @param {Array} newEdges - list of current relationships
 * @param {Object} schema - Knowledgebase db schema.
 */
const patchEdges = (originalEdges, newEdges, schema) => {
  const changedEdges = [];
  /* Checks for differences in original node and submitted form. */

  // Deletes edges that are no longer present on the edited node.
  originalEdges.forEach((edge) => {
    const matched = newEdges.find(r => r['@rid'] === edge['@rid']);
    if (!matched || matched.deleted) {
      const { routeName } = schema.get(edge['@class']);
      changedEdges.push(del(
        `${routeName}/${edge['@rid'].slice(1)}`,
      ));
    }
  });

  // Adds new edges that were not present on the original node.
  newEdges.forEach((relationship) => {
    if (!originalEdges.find(r => r['@rid'] === relationship['@rid'])) {
      const properties = schema.getProperties(relationship['@class']);
      const route = schema.getRoute(relationship['@class']);
      const payload = util.parsePayload(relationship, properties);
      changedEdges.push(post(route, payload));
    }
  });

  return Promise.all(changedEdges);
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
