/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import * as jc from 'json-cycle';

import auth from './auth';
import util from './util';
import config from '../static/config';
import {
  BadRequestError, AuthorizationError, AuthenticationError, RecordExistsError,
} from './errors';

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


class GraphKbApiCall {
  /**
   * Sends request to server, appending all global headers and handling responses and errors.
   * @param {string} endpoint - URL endpoint
   * @param {Object} init - Request properties.
   */
  constructor(endpoint, init) {
    this.endpoint = endpoint;
    this.init = init;
    this.controller = null;
  }

  /**
   * Cancel this fetch request
   */
  abort() {
    if (this.controller) {
      this.controller.abort();
    }
  }

  /**
   * Makes the fetch request and awaits the response or error. Also handles the redirect to error
   * or login pages
   */
  async request() {
    const initWithInterceptors = {
      ...this.init,
      headers: getHeaders(),
    };
    this.controller = new AbortController();
    const { signal } = this.controller;
    const request = new Request(API_BASE_URL + this.endpoint, initWithInterceptors);
    let response;
    try {
      response = await fetch(request, { signal });
    } catch (err) {
      if (err.name === 'AbortError') {
        return null;
      }
      throw err;
    }
    if (response.ok) {
      return response.json();
    }

    const { status, statusText, url } = response;

    const error = {
      ...(await response.json()),
      status,
      message: response.statusText,
      url,
    };
    if (status === 401) {
      auth.clearTokens();
      throw new AuthenticationError(error);
    }
    if (status === 400) {
      throw new BadRequestError(error);
    }
    if (status === 409) {
      throw new RecordExistsError(error);
    }
    if (status === 403) {
      throw new AuthorizationError(error);
    }
    throw new Error(`Unexpected Error [${status}]: ${statusText}`);
  }
}

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
  return new GraphKbApiCall(endpoint, init);
};

/**
 * Sends GET request to api.
 * @param {string} endpoint - URL endpoint.
 */
const get = (endpoint) => {
  const init = {
    method: 'GET',
  };
  return new GraphKbApiCall(endpoint, init);
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

  return new GraphKbApiCall(endpoint, init);
};

/**
 * Sends DELETE request to api.
 * @param {string} endpoint - URL endpoint.
 */
const del = (endpoint) => {
  const init = {
    method: 'DELETE',
  };

  return new GraphKbApiCall(endpoint, init);
};

/**
 * Wrapper for autosearch method.
 * @param {string} endpoint - URL endpoint.
 * @param {Array.<string>} property - Property to query.
 * @param {string} value - Query input string.
 * @param {number} limit - Limit for number of returned matches.
 */
const autoSearch = (endpoint, property, value, limit) => {
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

  return get(`/${endpoint}?${query}${orStr && `&${orStr}`}&${extras}`);
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

    newEdges.push(post(schema.get(edges[i]['@class']).routeName, edge));
  }
  return newEdges;
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
