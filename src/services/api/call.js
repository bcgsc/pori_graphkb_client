import * as jc from 'json-cycle';

import auth from '../auth';


import config from '../../static/config';
import {
  BadRequestError, AuthorizationError, AuthenticationError, RecordExistsError,
} from '../errors';

const {
  API_BASE_URL,
} = config;

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


class ApiCall {
  /**
     * Sends request to server, appending all global headers and handling responses and errors.
     * @param {string} endpoint - URL endpoint
     * @param {Object} init - Request properties.
     * @param {Object} requestOptions - options to be passed to the Request contstructor
     * @param {object} callOptions - other options
     * @param {object} callOptions.forceListReturn - always return a list for succesfull requests
     */
  constructor(endpoint, requestOptions, callOptions) {
    const {
      forceListReturn = false,
      isPutativeEdge = false,
    } = callOptions || {};
    this.endpoint = encodeURI(endpoint);
    this.requestOptions = requestOptions;
    this.controller = null;
    this.forceListReturn = forceListReturn;
    this.isPutativeEdge = isPutativeEdge;
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
    this.controller = new AbortController();
    const { signal } = this.controller;
    const request = new Request(API_BASE_URL + this.endpoint, {
      ...this.requestOptions,
      headers: getHeaders(),
    });
    let response;
    try {
      response = await fetch(request, { signal });
    } catch (err) {
      if (err.name === 'AbortError') {
        return null;
      }
      console.error(err);
      throw err;
    }
    if (response.ok) {
      const body = await response.json();
      const decycled = jc.retrocycle(body);
      let result = decycled.result !== undefined
        ? decycled.result
        : decycled;

      if (this.forceListReturn && !Array.isArray(result)) {
        result = [result];
      }
      if (this.isPutativeEdge) {
        if (Array.isArray(result)) {
          result = result.map(rec => ({ target: rec }));
        } else {
          result = { target: result };
        }
      }
      return result;
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
 * Set of Api calls to be co-requested and co-aborted
 */
class ApiCallSet {
  constructor(calls = []) {
    this.calls = calls;
  }

  push(call) {
    this.calls.push(call);
  }

  abort() {
    this.calls.forEach(controller => controller.abort());
  }

  async request() {
    return Promise.all(this.calls.map(call => async () => call.request()));
  }
}


export { ApiCall, ApiCallSet };
