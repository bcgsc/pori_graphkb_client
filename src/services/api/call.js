import { boundMethod } from 'autobind-decorator';
import * as jc from 'json-cycle';

import config from '@/static/config';

import {
  APIConnectionFailureError,
  AuthenticationError,
  AuthorizationError,
  BadRequestError,
  RecordExistsError,
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
      name = null,
    } = callOptions || {};
    this.endpoint = endpoint;
    this.requestOptions = requestOptions;
    this.controller = null;
    this.forceListReturn = forceListReturn;
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

    let response;

    try {
      response = await fetch(
        API_BASE_URL + this.endpoint,
        {
          ...this.requestOptions,
          headers: {
            'Content-type': 'application/json',
          },
          signal: this.controller.signal,
        },
      );
    } catch (err) {
      if (err.name === 'AbortError' && ignoreAbort) {
        return null;
      }
      // https://www.bcgsc.ca/jira/browse/SYS-55907
      console.error(err);
      console.error('Fetch error. Re-trying Request with cache-busting');
      this.controller = new AbortController();

      try {
        response = await fetch(
          API_BASE_URL + this.endpoint,
          {
            ...this.requestOptions,
            headers: {
              'Content-type': 'application/json',
            },
            signal: this.controller.signal,
            cache: 'reload',
          },
        );
      } catch (err2) {
        if (err2.name === 'AbortError' && ignoreAbort) {
          return null;
        }
        console.error(err2);
        throw err2;
      }
    }
    this.controller = null;

    if (response.ok) {
      const body = await response.json();
      const decycled = jc.retrocycle(body);
      let result = decycled.result !== undefined
        ? decycled.result
        : decycled;

      if (this.forceListReturn && !Array.isArray(result)) {
        result = [result];
      }
      return result;
    }

    const { status, statusText, url } = response;

    const error = {
      message: response.statusText,
      ...(await response.json()),
      status,
      url,
    };

    if (status === 401) {
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
    if (status === 404) {
      throw new APIConnectionFailureError(error);
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
