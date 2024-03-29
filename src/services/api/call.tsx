import * as jc from 'json-cycle';

import {
  APIConnectionFailureError,
  AuthenticationError,
  AuthorizationError,
  BadRequestError,
  RecordExistsError,
} from '../errors';

export interface RequestCallOptions {
  /** always return a list for succesful requests */
  forceListReturn?: boolean;
}

/**
 * Sends request to server, appending all global headers and handling responses and errors.
 * @param endpoint URL endpoint
 * @param requestOptions Request properties.
 * @param callOptions options to be passed to the Request for successful requests
 * @returns
 */
async function request(
  endpoint: string,
  requestOptions: RequestInit,
  callOptions?: RequestCallOptions,
) {
  if (
    requestOptions.method !== 'GET'
    && !['/query', '/parse', '/token'].includes(endpoint)
    && window._env_.IS_DEMO
  ) {
    throw new Error('Write operations are disabled in DEMO mode. Changes will not submit');
  }

  let response;

  try {
    response = await fetch(
      `${window._env_.API_BASE_URL}/api${endpoint}`,
      {
        ...requestOptions,
        headers: {
          'Content-type': 'application/json',
        },
      },
    );
  } catch (err) {
    // https://www.bcgsc.ca/jira/browse/SYS-55907
    console.error(err);
    console.error('Fetch error. Re-trying Request with cache-busting');

    try {
      response = await fetch(
        `${window._env_.API_BASE_URL}/api${endpoint}`,
        {
          ...requestOptions,
          headers: {
            'Content-type': 'application/json',
          },
          cache: 'reload',
        },
      );
    } catch (err2) {
      console.error(err2);
      throw err2;
    }
  }

  if (response.ok) {
    const body = await response.json();
    const decycled = jc.retrocycle(body);
    let result = decycled.result !== undefined
      ? decycled.result
      : decycled;

    if (callOptions?.forceListReturn && !Array.isArray(result)) {
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

export { request };
