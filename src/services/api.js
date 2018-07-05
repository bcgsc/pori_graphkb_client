import * as jc from 'json-cycle';
import auth from './auth';

const API_BASE_URL = 'http://kbapi01:8008/api/v0.0.8';
const CACHE_EXPIRY = 8;

/**
 * Wrapper for api, handles all requests and special functions.
 */
export default class api {
  /**
   * Appends global headers to outgoing request.
   */
  static getHeaders() {
    const headers = new Headers();
    headers.append('Content-type', 'application/json');
    if (auth.getToken()) {
      headers.append('Authorization', auth.getToken());
    }
    return headers;
  }

  /**
   * Sends PATCH request to api.
   * @param {string} endpoint - URL endpoint.
   * @param {Object} payload - PATCH payload.
   */
  static patch(endpoint, payload) {
    const init = {
      method: 'PATCH',
      body: JSON.stringify(payload),
    };
    return api.fetchWithInterceptors(endpoint, init);
  }

  /**
   * Sends GET request to api.
   * @param {string} endpoint - URL endpoint.
   */
  static get(endpoint) {
    const init = {
      method: 'GET',
    };
    return api.fetchWithInterceptors(endpoint, init);
  }

  /**
   * Sends POST request to api.
   * @param {string} endpoint - URL endpoint.
   * @param {Object} payload - POST payload.
   */
  static post(endpoint, payload) {
    const init = {
      method: 'POST',
      body: JSON.stringify(payload),
    };

    return api.fetchWithInterceptors(endpoint, init);
  }

  /**
   * Sends DELETE request to api.
   * @param {string} endpoint - URL endpoint.
   */
  static delete(endpoint) {
    const init = {
      method: 'DELETE',
    };

    return api.fetchWithInterceptors(endpoint, init);
  }

  /**
   * Sends request to server, appending all global headers and handling responses and errors.
   * @param {string} endpoint - URL endpoint
   * @param {Object} init - Request properties.
   */
  static fetchWithInterceptors(endpoint, init) {
    const initWithInterceptors = {
      ...init,
      headers: api.getHeaders(),
    };
    return fetch(new Request(API_BASE_URL + endpoint, initWithInterceptors))
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      })
      .catch((error) => {
        if (error.status === 401) {
          auth.clearToken();
        }

        return error.json().then(body => Promise.reject({
          status: error.status,
          body,
        }));
      });
  }

  /**
   * Returns all valid edge types.
   */
  static getEdgeTypes() {
    const edgeTypes = localStorage.getItem('edgeTypes');
    const edgeTypeExpiry = localStorage.getItem('edgeTypesExpiry');
    if (
      !edgeTypes
      || (edgeTypes && edgeTypeExpiry && edgeTypeExpiry < Date.now().valueOf())
      || !edgeTypeExpiry
    ) {
      return api.loadEdges();
    }
    return Promise.resolve(JSON.parse(edgeTypes));
  }

  /**
   * Requests edge types from api and loads into localstorage.
   */
  static loadEdges() {
    return api.get('/schema').then((response) => {
      const cycled = jc.retrocycle(response.schema);
      const list = [];
      Object.keys(cycled).forEach((key) => {
        if (
          cycled[key].inherits.includes('E') && cycled[key].inherits.includes('OntologyEdge')
        ) {
          list.push({ name: key });
        }
      });

      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + CACHE_EXPIRY);

      localStorage.setItem('edgeTypesExpiry', expiry.getTime());
      localStorage.setItem('edgeTypes', JSON.stringify(list));
      return Promise.resolve(list);
    });
  }

  /**
   * Returns all valid sources.
   */
  static getSources() {
    const sources = localStorage.getItem('sources');
    const sourcesExpiry = localStorage.getItem('sourcesExpiry');
    if (
      !sources || (sources && sourcesExpiry && sourcesExpiry < Date.now().valueOf())
    ) {
      return api.loadSources();
    }
    return Promise.resolve(JSON.parse(sources));
  }

  /**
   * Requests sources from api and loads into localstorage.
   */
  static loadSources() {
    return api.get('/sources').then((response) => {
      const cycled = jc.retrocycle(response.result);
      const list = [];
      cycled.forEach(source => list.push(source));

      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + CACHE_EXPIRY);

      localStorage.setItem('sourcesExpiry', expiry.getTime());
      localStorage.setItem('sources', JSON.stringify(list));

      return Promise.resolve(list);
    });
  }

  /**
   * Wrapper for autosearch method.
   * @param {string} endpoint - URL endpoint.
   * @param {string} property - Property to query.
   * @param {string} value - Query input string.
   * @param {number} limit - Limit for number of returned matches.
   */
  static autoSearch(endpoint, property, value, limit) {
    return api.get(
      `/${endpoint}?${property}=~${value}&limit=${limit}&neighbors=1`,
    );
  }
}
