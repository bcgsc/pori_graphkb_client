import * as jc from 'json-cycle';
import auth from './auth';

const API_BASE_URL = 'http://kbapi01:8008/api/v0.0.8';
const CACHE_EXPIRY = 8;
const KEYS = {
  ONTOLOGYVERTICES: 'ontologyVertices',
  SOURCES: 'sources',
  ONTOLOGYEDGES: 'ontologyEdges',
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
    const edgeTypes = localStorage.getItem(KEYS.ONTOLOGYEDGES);
    const edgeTypeExpiry = localStorage.getItem(`${KEYS.ONTOLOGYEDGES}Expiry`);
    if (
      !edgeTypes
      || (edgeTypes && edgeTypeExpiry && edgeTypeExpiry < Date.now().valueOf())
      || !edgeTypeExpiry
    ) {
      return api.loadOntologyEdges();
    }
    return Promise.resolve(JSON.parse(edgeTypes));
  }

  /**
   * Requests edge types from api and loads into localstorage.
   */
  static loadOntologyEdges() {
    return api.get('/schema').then((response) => {
      const cycled = jc.retrocycle(response.schema);
      const list = [];
      Object.keys(cycled).forEach((key) => {
        if (
          cycled[key].inherits.includes('E') && cycled[key].inherits.includes('OntologyEdge')
        ) {
          list.push(key);
        }
      });

      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + CACHE_EXPIRY);

      localStorage.setItem(`${KEYS.ONTOLOGYEDGES}Expiry`, expiry.getTime());
      localStorage.setItem(KEYS.ONTOLOGYEDGES, JSON.stringify(list));
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
   * Returns all valid ontology vertex types.
   */
  static getOntologyVertices() {
    const ontologies = localStorage.getItem(KEYS.ONTOLOGYVERTICES);
    const ontologiesExpiry = localStorage.getItem(`${KEYS.ONTOLOGYVERTICES}Expiry`);
    if (
      !ontologies
      || (
        ontologies
        && ontologiesExpiry
        && ontologiesExpiry < Date.now().valueOf()
      )
    ) {
      return api.loadOntologyVertices();
    }
    return Promise.resolve(JSON.parse(ontologies));
  }

  /**
   * Requests ontology vertices from the api and loads them into localstorage.
   */
  static loadOntologyVertices() {
    return api.get('/schema').then((response) => {
      const cycled = jc.retrocycle(response.schema);
      const list = [];
      Object.keys(cycled).forEach((key) => {
        if (
          cycled[key].inherits.includes('Ontology')
          && cycled[key].inherits.includes('V')
        ) {
          list.push({ name: key, properties: cycled[key].properties });
        }
      });

      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + CACHE_EXPIRY);

      localStorage.setItem(`${KEYS.ONTOLOGYVERTICES}Expiry`, expiry.getTime());
      localStorage.setItem(KEYS.ONTOLOGYVERTICES, JSON.stringify(list));

      return Promise.resolve(list);
    });
  }

  /**
  * Returns the vertex base class.
  */
  static getVertexBaseClass() {
    const vertex = localStorage.getItem(KEYS.V);
    const vExpiry = localStorage.getItem(`${KEYS.V}Expiry`);
    if (
      !vertex
      || (
        vertex
        && vExpiry
        && vExpiry < Date.now().valueOf()
      )
    ) {
      return api.loadVertexBaseClass();
    }
    return Promise.resolve(JSON.parse(vertex));
  }

  /**
    * Requests the vertex V from the api and loads it into localstorage.
    */
  static loadVertexBaseClass() {
    return api.get('/schema').then((response) => {
      const cycled = jc.retrocycle(response.schema);
      const now = new Date();
      const expiry = new Date(now);
      expiry.setHours(now.getHours() + CACHE_EXPIRY);

      localStorage.setItem(`${KEYS.V}Expiry`, expiry.getTime());
      localStorage.setItem(KEYS.V, JSON.stringify(cycled.V));

      return Promise.resolve(cycled.V);
    });
  }

  /**
   * Returns the editable properties of target ontology class.
   * @param {string} className - requested class name
   */
  static getEditableProps(className) {
    return api.get('/schema').then((response) => {
      const cycled = jc.retrocycle(response.schema);
      const V = Object.keys(cycled.V.properties);
      if (cycled[className]) {
        const props = Object.keys(cycled[className].properties).map(prop => (
          {
            name: prop,
            ...cycled[className].properties[prop],
          }));
        return Promise.resolve(props.filter(prop => !V.includes(prop.name)));
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
