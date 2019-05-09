import * as jc from 'json-cycle';
import { boundMethod } from 'autobind-decorator';

import auth from '../auth';


import config from '../../static/config';
import {
  BadRequestError, AuthorizationError, AuthenticationError, RecordExistsError,
} from '../errors';

const {
  API_BASE_URL,
} = config;


class ApiCall {
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

  /**
     * Cancel this fetch request
     */
  abort() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  isFinished() {
    return !this.controller;
  }

  /**
     * Makes the fetch request and awaits the response or error. Also handles the redirect to error
     * or login pages
     */
  @boundMethod
  async request(ignoreAbort = true) {
    this.controller = new AbortController();
    const { signal } = this.controller;

    let response;
    try {
      response = await fetch(
        API_BASE_URL + this.endpoint,
        {
          ...this.requestOptions,
          headers: {
            'Content-type': 'application/json',
          },
          signal,
        },
      );
      console.log('[API/calls.js fetch fn] response = ', response);
      // returns a response object
    } catch (err) {
      console.log('[API/calls.js] ERROR');
      if (err.name === 'AbortError' && ignoreAbort) {
        return null;
      }
      console.error(err);
      throw err;
    }
    this.controller = null;
    if (response.ok) {
      console.log('[API/calls.js before response.json()] response: ', response);
      const body = await response.json();
      console.log('[API/calls.js after response.json()] body: ', body);
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
      console.log('[API/calls.js fetch] processed response//result: ', result);
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
