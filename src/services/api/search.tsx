import { schema } from '@bcgsc-pori/graphkb-schema';
import * as qs from 'qs';

import { QueryBody } from '@/components/types';
import config from '@/static/config';

const DEFAULT_LIMIT = 100;
const {
  TABLE_DEFAULT_NEIGHBORS,
} = config;

/**
 * Given the search string from the URL/URI, parse
 * out the content for creating the API request
 *
 * @param {string} search the search string portion of the URL displayed by this app
 */
const getQueryFromSearch = (search: string): { payload: QueryBody, modelName: string; routeName: string } => {
  const {
    keyword,
    complex,
    ...params
  } = qs.parse(search.replace(/^\?/, ''));

  let modelName = 'v';

  if (params['@class'] || params.class) {
    // to make URL more readable class is sometimes used in place of @class
    // these are used to determine the route name and should not also appear as query params
    modelName = params.class || params['@class'];
    delete params['@class'];
    delete params.class;
  }

  if (!schema.get(modelName)) {
    throw new Error(`Failed to find the expected model (${modelName})`);
  }
  const routeName = '/query';

  let payload: QueryBody = {};

  if (complex) {
    // complex encodes the body in the URL so that it can be passed around as a link but still perform a POST search
    // Decode base64 encoded string.
    payload = JSON.parse(atob(decodeURIComponent(complex)));
    payload.neighbors = Math.max(payload.neighbors || 0, TABLE_DEFAULT_NEIGHBORS);
    payload.limit = Math.min(payload.limit || DEFAULT_LIMIT);
  }
  return {
    routeName, payload, modelName,
  };
};

/**
 * Given the API search. Return the search string to display in the top URL bar
 *
 * @param {object} opt
 * @param {object} opt.payload the body/payload
 */
const getSearchFromQuery = ({
  payload, modelName,
}: ReturnType<typeof getQueryFromSearch>) => {
  const alphaSort = (a, b) => a.localeCompare(b);
  const complex = btoa(JSON.stringify(payload));
  return qs.stringify({ class: modelName, complex }, { sort: alphaSort });
};

export {
  DEFAULT_LIMIT,
  getQueryFromSearch,
  getSearchFromQuery,
};
