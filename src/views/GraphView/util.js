import api from '@/services/api';

import SEARCH_OPTS from '../PopularSearchView/components/util';


/* URL decoding module to build new search, search chips and filter table props */

/**
* ridMap to replace rids with user readable values in filter table
* @param {object} cache cache object to fetch full records for displayName or name
* @param {object} filters query object used to extract relevant rids
* returns ridMap ex. { "148:34" : "sensitivity"}
*/
const generateRidMap = async (cache, filters) => {
  if (!filters) {
    return {};
  }
  const totalValues = [];
  // collect values to construct ridMap
  filters.OR.forEach((fg) => {
    const filterGroup = fg.AND;
    filterGroup.forEach((filter) => {
      const { operator, ...prop } = filter;
      const [key] = Object.keys(prop);

      if (Array.isArray(prop[key])) {
        totalValues.push(...prop[key]);
      } else {
        totalValues.push(prop[key]);
      }
    });
  });

  // filter out values that dont look like rids
  const ridCheck = RegExp(/^#?-?\d{1,5}:-?\d+$/);
  const uniqueValues = new Set(totalValues);
  const rids = [...uniqueValues].filter(el => ridCheck.test(el));
  const records = await cache.getRecords([...rids]);
  const ridMap = {};
  records.forEach((rec) => {
    ridMap[rec['@rid']] = rec.displayName || rec.name;
  });

  return ridMap;
};

/**
 * creates filter table filter group props from the original query.
 * Replaces the rids used in queries with displayName or name property.
 * @param {object} query query complex/payload sent to api
 * @param {object} ridMap maps rid to record name/display name for filter table
 */
const generateFilterGroups = (query, ridMap) => {
  if (!query) {
    return [];
  }
  const filterGroups = query.OR.map((fg) => {
    const filterGroup = fg.AND;
    const chipGroup = filterGroup.map((filter) => {
      const { operator, ...prop } = filter;
      const [key] = Object.keys(prop);
      let chip;

      if (Array.isArray(prop[key])) {
        const conditions = prop[key].map(rid => ridMap[rid]).join(', ');
        chip = `${key} ${operator} ${conditions}`;
      } else {
        chip = ridMap[prop[key]]
          ? `${key} ${operator} ${ridMap[prop[key]]}`
          : `${key} ${operator} ${prop[key]}`;
      }
      return chip;
    });
    return chipGroup;
  });
  return filterGroups;
};

/**
 * Generates search chips for selected popular search and new encoded search to
 * pass to DataTable. To reduce URL length, popular searches are encoded with a
 * variant and index match in the URL which is then parsed for search option mapping.
 *
 * @param {object} searchProps contains variant type, index, value and optional value
 * @param {string} modelName class type of record
 */
const getPopularChipsPropsAndSearch = async (searchProps, modelName) => {
  const {
    value, optionalValue, variant, searchIndex,
  } = searchProps;
  const selectedOption = SEARCH_OPTS[variant][searchIndex];

  const chipProps = selectedOption.searchChipProps(value, optionalValue);
  const query = selectedOption.search(value, optionalValue);
  const search = api.encodeQueryComplexToSearch(query, modelName);
  return { search, chipProps };
};

/**
 * From the payload/complex parsed from URL, generate the filterGroups that
 * were used. These will be turned into filter chips for the filter table.
 *
 * @param {object} filters equivalent to payload / complex query
 * @param {Cache} cache fetches records for rid
 */
const getFilterTableProps = async (filters, cache) => {
  const ridMap = await generateRidMap(cache, filters);
  const filterGroups = generateFilterGroups(filters, ridMap);
  return filterGroups;
};

export {
  getFilterTableProps,
  getPopularChipsPropsAndSearch,
};
