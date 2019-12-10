const FIELD_EXCLUSIONS = ['groupRestrictions'];

/**
 * returns an array of strings without any of the indicated exclusion values
 *
 * @param {Array.<string>} orderingList specifies property display ordering
 * @param {Array.<string>} exclusions fields that should not be rendered
 */
const exclusionFilter = (orderingList, exclusions) => {
  const newOrdering = [];
  orderingList.forEach((filter) => {
    if (Array.isArray(filter)) {
      newOrdering.push(exclusionFilter(filter, exclusions));
    } else if (!exclusions.includes(filter)) {
      newOrdering.push(filter);
    }
  });
  return newOrdering;
};

const cleanPayload = (payload) => {
  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }
  const newPayload = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && !/^(in|out)_\w+$/.exec(key)) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          newPayload[key] = value.map((arr) => {
            if (arr && arr['@rid']) {
              return arr['@rid'];
            }
            return cleanPayload(arr);
          });
        } else if (value['@rid']) {
          newPayload[key] = value['@rid'];
        } else {
          newPayload[key] = value;
        }
      } else {
        newPayload[key] = value;
      }
    }
  });
  return newPayload;
};

export {
  FIELD_EXCLUSIONS,
  cleanPayload,
  exclusionFilter,
};
