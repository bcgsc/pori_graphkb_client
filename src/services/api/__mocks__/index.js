import * as jc from 'json-cycle';
import { boundMethod } from 'autobind-decorator';

const api = jest.genMockFromModule('index');
class MockApiCall {
  /**
     * Sends request to server, appending all global headers and handling responses and errors.
     * @param {string} endpoint - URL endpoint
     * @param {Object} init - Request properties.
     * @param {Object} requestOptions - options to be passed to the Request contstructor
     * @param {object} callOptions - other options
     * @param {object} callOptions.forceListReturn - always return a list for succesful requests
     * @param {string} callOptions.name function name to use
     */
  constructor(endpoint, requestOptions, callOptions) {
    const {
      forceListReturn = false,
      isPutativeEdge = false,
      name = null,
    } = callOptions || {};
    this.endpoint = endpoint;
    this.requestOptions = requestOptions;
    this.controller = null;
    this.forceListReturn = forceListReturn;
    this.isPutativeEdge = isPutativeEdge;
    this.name = name || endpoint;
  }

  // create 2 mock methods : request and abort
  // abort() {

  // }

  @boundMethod
  async request(ignoreAbort = true) {
    if (this.endpoint === '/users/20:25') {
      console.log('MOCK APICALL HIT');
    }
    if (!ignoreAbort) {
      return;
    }
    console.log('[MockApiCall] REQUEST INITIATED!');
    await Promise.resolve('request');
  }
}
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
  return new MockApiCall(endpoint, init, callOptions);
};

/**
 * Sends GET request to api.
 * @param {string} endpoint - URL endpoint.
 */
const get = (endpoint, callOptions) => {
  const init = {
    method: 'GET',
  };
  return new MockApiCall(endpoint, init, callOptions);
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
  return new MockApiCall(endpoint, init, callOptions);
};

/**
 * Sends DELETE request to api.
 * @param {string} endpoint - URL endpoint.
 */
const del = (endpoint, callOptions) => {
  const init = {
    method: 'DELETE',
  };
  return new MockApiCall(endpoint, init, callOptions);
};

// module should contain methods for post, patch, get and delete
api.delete = del;
api.del = del;
api.get = get;
api.post = post;
api.get = get;
api.patch = patch;

module.exports = api;
