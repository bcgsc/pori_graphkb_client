/**
 * Wrapper for api, handles all requests and special functions.
 * @module /services/api
 */
import React from 'react';
import { mount } from 'enzyme';
import * as jc from 'json-cycle';


import { ApiCall } from './call';


/**
 * Sends PATCH request to api.
 * @param {string} endpoint - URL endpoint.
 * @param {Object} payload - PATCH payload.
 */

const api = jest.genMockFromModule('index');

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
  console.log('[mock delete ApiCall] callOptions', callOptions);
  return new ApiCall(endpoint, init, callOptions);
};

api.get = get;
api.patch = patch;
api.post = post;
api.del = del;

module.exports = api;
