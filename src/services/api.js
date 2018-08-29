/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import * as jc from 'json-cycle';
import auth from './auth';
import config from '../config.json';
import history from './history';

const {
  VERSION,
  KEYS,
  PORT,
  HOST,
} = config;
const API_BASE_URL = `http://${HOST}:${PORT}/api/v${VERSION}`;
const CACHE_EXPIRY = 8;

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
const fetchWithInterceptors = (endpoint, init) => {
  const initWithInterceptors = {
    ...init,
    headers: getHeaders(),
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
    })))
    .catch((error) => {
      if (error.status === 401) {
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
      if (error.status === 400) {
        history.push({ pathname: '/query/advanced', state: error });
        return Promise.reject('Invalid Query');
      }
      history.push({ pathname: '/error', state: { status: error.status, body: error.body } });
      return Promise.reject('Unexpected Error, redirecting...');
    });
};

/**
 * Sends PATCH request to api.
 * @param {string} endpoint - URL endpoint.
 * @param {Object} payload - PATCH payload.
 */
const patch = (endpoint, payload) => {
  const init = {
    method: 'PATCH',
    body: JSON.stringify(payload),
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
    body: JSON.stringify(payload),
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
 * Requests sources from api and loads into localstorage.
 */
const loadSources = () => get('/sources').then((response) => {
  const cycled = jc.retrocycle(response.result);
  const list = [];
  cycled.forEach(source => list.push(source));

  const now = new Date();
  const expiry = new Date(now);
  expiry.setHours(now.getHours() + CACHE_EXPIRY);
  const sources = {
    sources: cycled,
    version: VERSION,
    expiry: expiry.getTime(),
  };

  localStorage.setItem(KEYS.SOURCES, JSON.stringify(sources));

  return Promise.resolve(list);
});

/**
 * Returns all valid sources.
 */
const getSources = () => {
  const sources = JSON.parse(localStorage.getItem(KEYS.SOURCES));
  if (
    !sources
    || (sources
      && sources.expiry
      && sources.expiry < Date.now().valueOf()
    )
    || sources.version !== VERSION
    || !sources.sources
  ) {
    return loadSources();
  }
  return Promise.resolve(sources.sources);
};

/**
 * Requests schema from api and loads into localstorage.
 */
const loadSchema = () => get('/schema').then((response) => {
  const cycled = jc.retrocycle(response.schema);
  const now = new Date();
  const expiry = new Date(now);
  expiry.setHours(now.getHours() + CACHE_EXPIRY);

  const schema = {
    schema: cycled,
    version: VERSION,
    expiry: expiry.getTime(),
  };

  localStorage.setItem(KEYS.SCHEMA, JSON.stringify(schema));

  return Promise.resolve(cycled);
});

/**
 * Returns the database schema.
 */
const getSchema = () => {
  const schema = JSON.parse(localStorage.getItem(KEYS.SCHEMA) || '{}');
  if (
    !schema
    || (
      schema
      && schema.expiry
      && schema.expiry < Date.now().valueOf()
    )
    || schema.version !== VERSION
    || !schema.schema
  ) {
    return loadSchema();
  }
  return Promise.resolve(schema.schema);
};

/**
 * Returns the editable properties of target ontology class.
 * @param {string} className - requested class name
 */
const getClass = className => getSchema().then((schema) => {
  const VPropKeys = Object.keys(schema.V.properties);
  const classKey = (Object.keys(schema)
    .find(key => key.toLowerCase() === (className || '').toLowerCase()) || 'Ontology');
  const props = Object.keys(schema[classKey].properties)
    .filter(prop => !VPropKeys.includes(prop))
    .map(prop => (
      {
        ...schema[classKey].properties[prop],
      }));
  return Promise.resolve({ route: schema[classKey].route, properties: props });
});

/**
 * Wrapper for autosearch method.
 * @param {string} endpoint - URL endpoint.
 * @param {string} property - Property to query.
 * @param {string} value - Query input string.
 * @param {number} limit - Limit for number of returned matches.
 */
const autoSearch = (endpoint, property, value, limit) => {
  if (value.length < 4) return Promise.resolve({ result: [] });
  const query = property.map(p => `${p}=~${encodeURIComponent(value)}`).join('&');
  const orStr = `or=${property.join(',')}`;
  return get(`/${endpoint}?${query}&${orStr}&limit=${limit}&neighbors=1&@class=!Publication`);
};

/**
 * Updates allColumns list with any new properties from ontologyTerm.
 * @param {Object} ontologyTerm - new node who's properties will be parsed.
 * @param {Array} allColumns - current list of all collected properties.
 * @param {Object} schema - api schema.
 */
const collectOntologyProps = (ontologyTerm, allColumns, schema) => {
  const { properties } = schema[ontologyTerm['@class']];
  const { V } = schema;
  Object.keys(ontologyTerm).forEach((prop) => {
    if (!V.properties[prop] && prop !== '@class' && !allColumns.includes(prop)) {
      const endpointProp = properties[prop];
      if (endpointProp && endpointProp.type === 'link') {
        Object.keys(ontologyTerm[prop]).forEach((nestedProp) => {
          if (
            !V.properties[nestedProp]
            && !allColumns.includes(`${prop}.${nestedProp}`)
            && !nestedProp.startsWith('in_')
            && !nestedProp.startsWith('out_')
            && !(endpointProp.linkedClass && nestedProp === '@class')
            && (properties[nestedProp] || {}).type !== 'link'
          ) {
            allColumns.push(`${prop}.${nestedProp}`);
          }
        });
      } else {
        allColumns.push(prop);
      }
    }
  });
  return allColumns;
};

/**
  * Returns all valid ontology types.
  */
const getOntologies = (schema) => {
  const list = [];
  Object.keys(schema).forEach((key) => {
    if (schema[key].inherits.includes('Ontology')) {
      list.push({ name: key, properties: schema[key].properties, route: schema[key].route });
    }
  });
  return list;
};

/**
  * Returns all valid edge types.
  */
const getEdges = (schema) => {
  const list = [];
  Object.keys(schema).forEach((key) => {
    if (schema[key].inherits.includes('E')) {
      list.push(key);
    }
  });
  return list;
};

export default {
  getEdges,
  getOntologies,
  collectOntologyProps,
  getHeaders,
  getClass,
  getSchema,
  getSources,
  get,
  post,
  delete: del,
  patch,
  autoSearch,
};
