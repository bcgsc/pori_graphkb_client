import * as jc from 'json-cycle';
import auth from './auth';

const API_BASE_URL = 'http://kbapi01:8008/api/v0.0.8';
const CACHE_EXPIRY = 8;
const KEYS = {
  ONTOLOGYVERTICES: 'ontologyVertices',
  SOURCES: 'sources',
  ONTOLOGYEDGES: 'ontologyEdges',
  V: 'baseVertex',
  SCHEMA: 'schema',
};

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
      .catch(error => error.json().then(body => Promise.reject({
        status: error.status,
        body,
      })));
  }

  /**
   * Returns all valid edge types.
   */
  static getOntologyEdges() {
    return api.getSchema().then((schema) => {
      const list = [];
      Object.keys(schema).forEach((key) => {
        if (
          schema[key].inherits.includes('E')
          && schema[key].inherits.includes('OntologyEdge')
        ) {
          list.push(key);
        }
      });
      return Promise.resolve(list);
    });
  }

  /**
   * Returns all valid sources.
   */
  static getSources() {
    const sources = localStorage.getItem(KEYS.SOURCES);
    const sourcesExpiry = localStorage.getItem(`${KEYS.SOURCES}Expiry`);
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

      localStorage.setItem(`${KEYS.SOURCES}Expiry`, expiry.getTime());
      localStorage.setItem(KEYS.SOURCES, JSON.stringify(list));

      return Promise.resolve(list);
    });
  }

  /**
   * Requests schema from api and loads into localstorage.
   */
  static loadSchema() {
    return api.get('/schema').then((response) => {
      const cycled = jc.retrocycle(response.schema);
      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + CACHE_EXPIRY);

      localStorage.setItem(`${KEYS.SCHEMA}Expiry`, expiry.getTime());
      localStorage.setItem(KEYS.SCHEMA, JSON.stringify(cycled));

      return Promise.resolve(cycled);
    });
  }

  /**
   * Returns schema.
   */
  static getSchema() {
    const schema = localStorage.getItem(KEYS.SCHEMA);
    const schemaExpiry = localStorage.getItem(`${KEYS.SCHEMA}Expiry`);
    if (
      !schema
      || (
        schema
        && schemaExpiry
        && schemaExpiry < Date.now().valueOf()
      )
    ) {
      return api.loadSchema();
    }
    return Promise.resolve(JSON.parse(schema));
  }

  /**
   * Returns all valid ontology vertex types.
   */
  static getOntologyVertices() {
    return api.getSchema().then((schema) => {
      const list = [];
      Object.keys(schema).forEach((key) => {
        if (
          schema[key].inherits.includes('Ontology')
          && schema[key].inherits.includes('V')
        ) {
          list.push({ name: key, properties: schema[key].properties });
        }
      });
      return Promise.resolve(list);
    });
  }

  /**
  * Returns the vertex base class.
  */
  static getVertexBaseClass() {
    return api.getSchema().then(schema => Promise.resolve(schema.V));
  }

  /**
   * Returns the editable properties of target ontology class.
   * @param {string} className - requested class name
   */
  static getEditableProps(className) {
    return api.getSchema().then((schema) => {
      const VPropKeys = Object.keys(schema.V.properties);
      if (schema[className]) {
        const props = Object.keys(schema[className].properties).map(prop => (
          {
            name: prop,
            ...schema[className].properties[prop],
          }));
        return Promise.resolve(props.filter(prop => !VPropKeys.includes(prop.name)));
      }
      return Promise.reject('Class not found');
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
