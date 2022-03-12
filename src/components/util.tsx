import * as qs from 'qs';

const CLASS_MODEL_PROP = '@class';

const FORM_VARIANT = {
  EDIT: 'edit', VIEW: 'view', DELETE: 'delete', NEW: 'new', SEARCH: 'search',
};


/**
 * Given some model and options, sort the form fields and return the ordering. The 'fold'
 * described here is the collapsible block. Elements above the fold are in the top non-collapsed block
 * whereas fields below the fold are put into the collapsible section
 *
 * @param {ClassModel} model the current class model to base the form off of
 * @param {object} opt grouping options
 * @param {Array.<string>} opt.belowFold names of properties that should fall below the fold
 * @param {Array.<string>} opt.aboveFold names of properties that should be promoted above the fold
 * @param {boolean} opt.collapseExtra flag to indicate if a collaspible section should be created
 * @param {Array.<Array.<string>>} opt.groups properties that should co-occur
 * @param {string} opt.variant the form variant this is being grouped for
 *
 * @returns {Object.<string,Array.<(string|Array.<string>)>>} the nested grouping structure
 *
 * @example
 * > sortAndGroupFields(model, {
 *    aboveFold: ['@class', '@rid', 'createdAt'],
 *    groups: [['createdBy', 'createdAt']]
 * })
 * {fields: ['@class', '@rid', ['createdBy', 'createdAt']], extraFields: []}
 */
const sortAndGroupFields = (model, opt = {}) => {
  const {
    belowFold = [],
    aboveFold = [],
    collapseExtra = false,
    groups = [],
    variant = FORM_VARIANT.VIEW,
  } = opt;

  const groupMap = {};

  if (!model) {
    return { extraFields: [], fields: [] };
  }
  const { properties } = model;

  groups.forEach((groupItems) => {
    // assume each field only can belong to a single group, overwrite others
    const key = groupItems.slice().sort((p1, p2) => p1.localeCompare(p2)).join('-');
    const groupDefn = {
      fields: groupItems.filter(fname => properties[fname]),
      mandatory: false,
      generated: true,
      name: key,
    };

    if (groupDefn.fields.length > 1) {
      groupDefn.fields.forEach((name) => {
        const { mandatory, generated } = properties[name];
        groupDefn.mandatory = groupDefn.mandatory || mandatory;
        groupDefn.generated = groupDefn.generated && generated;
        groupMap[name] = groupDefn;
      });
    }
  });

  const mainFields = [];
  const extraFields = [];

  const visited = new Set();

  const sortedPropModels = Object.values(model.properties)
    .sort((p1, p2) => {
      if (p1.mandatory === p2.mandatory || variant === FORM_VARIANT.VIEW) {
        return p1.name.localeCompare(p2.name);
      } if (p1.mandatory) {
        return -1;
      }
      return 1;
    });

  // get the form content
  for (const prop of sortedPropModels) { // eslint-disable-line no-restricted-syntax
    if (prop.name === CLASS_MODEL_PROP
      || (variant === FORM_VARIANT.NEW && prop.generated)
    ) {
      continue; // eslint-disable-line no-continue
    }
    const {
      name, mandatory, generated, fields,
    } = (groupMap[prop.name] || prop);

    const isAboveFold = fields
      ? fields.some(fname => aboveFold.includes(fname))
      : aboveFold.includes(name);

    const isBelowFold = fields
      ? fields.some(fname => belowFold.includes(fname))
      : belowFold.includes(name);

    const mustBeFilled = (
      prop.mandatory
      && variant === FORM_VARIANT.NEW
      && prop.default === undefined
      && !prop.generated
    );

    if (!visited.has(name)) {
      if (!collapseExtra || isAboveFold || mustBeFilled) {
        mainFields.push(fields || name);
      } else if (isBelowFold) {
        extraFields.push(fields || name);
      } else if (mandatory && !generated && prop.default === undefined) {
        mainFields.push(fields || name);
      } else {
        extraFields.push(fields || name);
      }
    }
    visited.add(name);

    if (fields) {
      visited.add(...fields);
    }
  }
  return { fields: mainFields, extraFields };
};

const cleanLinkedRecords = (content) => {
  const newContent = {};

  Object.keys(content).forEach((key) => {
    if (content[key] !== undefined) {
      if (Array.isArray(content[key])) {
        try {
          const ridArr = content[key].map(rec => (rec['@rid']));

          if (content[key].length === 1) {
            newContent[key] = ridArr.join();
          } else {
            newContent[key] = ridArr;
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          if (content[key]['@rid']) {
            newContent[key] = content[key]['@rid'];
          } else {
            newContent[key] = content[key];
          }
        } catch (err) {
          newContent[key] = content[key];
        }
      }
    }
  });
  return newContent;
};


const cleanUndefined = (content) => {
  const newContent = {};

  if (typeof content !== 'object' || content === null) {
    return content;
  }

  Object.keys(content).forEach((key) => {
    if (content[key] !== undefined) {
      newContent[key] = cleanUndefined(content[key]);
    }
  });
  return newContent;
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

/**
 * Save graph state (nodeRIDS) to URL and jump to graphview with nodeRIDs as initial seed
 *
 * @param {Arrayof.<strings>} nodeRIDs an array of node RIDs
 * @param {object} history history object
 * @param {function} onErrorCallback callback function to call if error occurs
 */
const navigateToGraph = (nodeRIDs, history, onErrorCallback) => {
  const savedState = {};
  let encodedState;

  try {
    const stringifiedState = JSON.stringify(nodeRIDs);
    const base64encodedState = btoa(stringifiedState);
    const encodedContent = encodeURIComponent(base64encodedState);

    savedState.nodes = encodedContent;
    encodedState = qs.stringify(savedState);
  } catch (err) {
    onErrorCallback(err);
  }

  history.push({
    pathname: '/data/graph',
    search: `${encodedState}`,
  });
};

/**
 * parses through URL and decodes it to return an array of node RIDs.
 */
const getNodeRIDsFromURL = (href) => {
  const URLBeforeNodeEncoding = href.split('nodes')[0];
  const encodedData = href.split(URLBeforeNodeEncoding)[1];
  const { nodes } = qs.parse(encodedData.replace(/^\?/, ''));

  const decodedContent = decodeURIComponent(nodes);
  const base64decoded = atob(decodedContent);
  const decodedNodes = JSON.parse(base64decoded);
  return decodedNodes;
};

export {
  cleanLinkedRecords,
  cleanUndefined,
  sortAndGroupFields,
  CLASS_MODEL_PROP,
  FORM_VARIANT,
  cleanPayload,
  navigateToGraph,
  getNodeRIDsFromURL,
};
