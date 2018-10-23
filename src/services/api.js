/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import * as jc from 'json-cycle';
import auth from './auth';
import config from '../static/config.json';
import history from './history';
import Schema from '../models/schema';

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
const fetchWithInterceptors = async (endpoint, init) => {
  const initWithInterceptors = {
    ...init,
    headers: getHeaders(),
  };
  try {
    const response = await fetch(new Request(API_BASE_URL + endpoint, initWithInterceptors));
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
    return Promise.reject(error);
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
const loadSources = async () => {
  try {
    const response = await get('/sources');
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
  } catch (e) {
    return Promise.reject(e);
  }
};

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
const loadSchema = async () => {
  try {
    const response = await get('/schema');
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

    return Promise.resolve(new Schema(cycled));
  } catch (e) {
    return Promise.reject(e);
  }
};

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
  return Promise.resolve(new Schema(schema.schema));
};

/**
 * Wrapper for autosearch method.
 * @param {string} endpoint - URL endpoint.
 * @param {string} property - Property to query.
 * @param {string} value - Query input string.
 * @param {number} limit - Limit for number of returned matches.
 */
const autoSearch = (endpoint, property, value, limit) => {
  const re = new RegExp(/[\r|\n|\t|:|\\|;|,|.|/|||+|*|=|!|?|[|\]|(|)]+/, 'g');
  const literalRe = new RegExp(/^['"].*['"]$/);
  if (value.trim().split(re).some(s => s.length < 4)) return Promise.resolve({ result: [] });

  const orStr = `or=${property.join(',')}`;
  let extras = `limit=${limit}&neighbors=1`;
  let query;

  if (value.match(literalRe)) {
    query = property
      .map(p => `${p}=${encodeURIComponent(value.slice(1, value.length - 1).replace(re, '').trim())}`)
      .join('&');
  } else {
    query = property
      .map(p => `${p}=~${encodeURIComponent(value.replace(re, '').trim())}`)
      .join('&');
    extras += '&@class=!Publication';
  }

  return get(`/${endpoint}?${query}&${orStr}&${extras}`);
};

export default {
  getSchema,
  getSources,
  get,
  post,
  delete: del,
  patch,
  autoSearch,
};
