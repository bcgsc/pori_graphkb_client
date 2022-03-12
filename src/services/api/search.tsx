import * as qs from 'qs';

import config from '@/static/config';

const DEFAULT_LIMIT = 100;
const {
  TABLE_DEFAULT_NEIGHBORS,
} = config;

const buildLooseSearch = (cls, name) => ({
  queryType: 'similarTo',
  target: {
    target: cls,
    filters: {
      OR: [
        { name },
        { sourceId: name },
      ],
    },
  },
});

const buildSearchFromParseVariant = (schema, variant) => {
  const { reference1, reference2, type } = variant;
  const payload = {
    target: 'PositionalVariant',
    filters: {
      AND: [
        {
          reference1: buildLooseSearch('Feature', reference1),
        },
        {
          type: buildLooseSearch('Vocabulary', type),
        },
      ],
    },
  };

  if (reference2) {
    payload.filters.AND.push(buildLooseSearch(reference2));
  } else {
    payload.filters.AND.push({ reference2: null });
  }

  schema.getProperties('PositionalVariant').filter(p => !p.name.includes('Repr')).forEach((prop) => {
    if (prop.type !== 'link' && variant[prop.name] && !prop.generated) {
      const value = variant[prop.name];

      if (prop.type.includes('embedded')) {
        Object.entries(value, ([subProp, subValue]) => {
          payload.filters.AND.push({ [`${prop.name}.${subProp}`]: subValue });
        });
      } else {
        payload.filters.AND.push({ [prop.name]: variant[prop.name] });
      }
    }
  });

  return payload;
};

/**
 * Given the search string from the URL/URI, parse
 * out the content for creating the API request
 *
 * @param {object} opt
 * @param {Schema} opt.schema
 * @param {string} opt.search the search string portion of the URL displayed by this app
 */
const getQueryFromSearch = ({ schema, search }) => {
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

  let payload = {};

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
   * @param {Schema} opt.schema
   * @param {string} opt.routeName the API route name being queried
   * @param {object} opt.queryParams the query parameters
   * @param {object} opt.payload the body/payload
   */
const getSearchFromQuery = ({
  schema, routeName, queryParams: queryParamsIn = {}, payload = null, ...opt
}) => {
  const queryParams = { ...queryParamsIn };
  let { modelName } = opt;

  if (queryParams && !modelName) {
    // to make URL more readable class is sometimes used in place of @class
    // these are used to determine the route name and should not also appear as query params
    modelName = queryParams.class || queryParams['@class'];
    delete queryParams.class;
    delete queryParams['@class'];
  }
  if (routeName && !modelName) {
    const match = /(\/[^/]+)(\/search)?$/.exec(routeName);
    const { name } = schema.getFromRoute(match[1]);
    modelName = name;
  }
  const alphaSort = (a, b) => a.localeCompare(b);

  if (payload) {
    // complex query
    const complex = btoa(JSON.stringify(payload));
    return qs.stringify({ class: modelName, complex }, { sort: alphaSort });
  } if (!queryParams.keyword) {
    return qs.stringify({ class: modelName, ...queryParams }, { sort: alphaSort });
  }
  return qs.stringify(queryParams, { sort: alphaSort });
};

export {
  buildSearchFromParseVariant, getSearchFromQuery, getQueryFromSearch, DEFAULT_LIMIT,
};
