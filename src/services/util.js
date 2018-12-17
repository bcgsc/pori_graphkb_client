/**
 * Handles miscellaneous tasks.
 * @module /services/util
 */
import * as jc from 'json-cycle';
import config from '../static/config';

const {
  PERMISSIONS,
  GRAPH_DEFAULTS,
  GRAPH_PROPERTIES: { NODE_INIT_RADIUS },
  KEYS: { GRAPH_OBJECTS },
} = config;
const { PALLETE_SIZE } = GRAPH_DEFAULTS;

const ACRONYMS = [
  'id',
  'uuid',
  'ncit',
  'uberon',
  'doid',
  'url',
  'cds',
  'hgnc',
  'bcgsc',
  'fda',
  'null',
  'rid',
  'iupac',
];
const DEFAULT_CUTOFF = 25;


/**
 * Casts a value to string form with minimal formatting. Sets the value to
 * 'null' if the value is null or undefined.
 * @param {any} obj - Object to be formatted.
 */
const castToExist = (obj) => {
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      return obj.join(', ');
    }
    return 'null';
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).find((e) => {
      const [k, v] = e;
      return (
        (typeof v !== 'object' || typeof v !== 'function')
        && !k.startsWith('@'));
    })[1].toString();
  }
  return obj === undefined || obj === null ? 'null' : obj.toString();
};

/**
 * Parses a string and capitalizes known acronyms.
 * @param {string | Array.<string>} str - String to be parsed.
 */
const parseAcronyms = (str) => {
  let words = str;
  if (!Array.isArray(str)) {
    words = str.split(' ');
  }
  ACRONYMS.forEach((acronym) => {
    const re = new RegExp(`^${acronym}*$`, 'ig');
    words.forEach((word, i) => {
      words[i] = word.replace(re, match => match.toUpperCase());
    });
  });
  return words.join(' ');
};

const shortenString = (str, cutoff = DEFAULT_CUTOFF) => {
  if (str && str.length > cutoff) {
    return `${str.substring(0, cutoff - 4).trim()}...`;
  }
  return str;
};

/**
 * Un-camelCase's input string and capitalizes each word. Also applies
 * capitalization to defined acronyms.
 * @example
 * > antiCamelCase('sourceId')
 * > 'Source ID'
 * @example
 * > anticamelCase('genomeScience')
 * > 'Genome Science'
 * @param {string} str - camelCase'd string.
 */
const antiCamelCase = (str) => {
  let accstr = str.toString();
  if (accstr.startsWith('@')) accstr = accstr.slice(1);
  let words = [accstr];
  if (accstr.includes('.')) {
    words = accstr.split('.');
  }

  words = words.reduce((array, word) => {
    const newWords = word.replace(/[A-Z]+|[0-9]+/g, match => ` ${match}`);
    if (newWords) {
      array.push(...newWords.split(' '));
    } else {
      array.push(word);
    }
    return array;
  }, []);

  accstr = parseAcronyms(words).trim();
  return accstr.charAt(0).toUpperCase() + accstr.slice(1);
};

/**
 * Infers the KB type string of a JS object.
 * @param {any} obj - input object.
 */
const parseKBType = (obj) => {
  if (typeof obj === 'number') {
    if (Number.isInteger(obj)) {
      return 'integer';
    }
    return 'float';
  }
  if (Array.isArray(obj)) {
    return 'embeddedset';
  }
  if (obj && typeof obj === 'object') {
    if (Object.keys(obj).includes('@rid')) {
      return 'link';
    }
    return 'embedded';
  }
  return 'string';
};

/**
 * Capitalizes sentences in input string.
 * @param {string} str - input string.
 */
const formatStr = (str) => {
  const newSentence = /\.\s\w/g;
  const ret = parseAcronyms(castToExist(str))
    .trim()
    .replace(newSentence, match => match.toUpperCase());
  return ret;
};

/**
 * Expands edges to field property names, with either 'in_' or 'out_'
 * appended to them.
 * @param {Array.<string>} edges - list of edge classes.
 */
const expandEdges = edges => edges.reduce((r, edge) => {
  r.push(`in_${edge}`);
  r.push(`out_${edge}`);
  return r;
}, []);

/**
 * Returns the plaintext representation of a value in order to be loaded into
 * a TSV file. Parses nested objects and arrays using the key as reference.
 * @param {any} value - Value
 * @param {string} key - Object Key.
 */
const getTSVRepresentation = (value, key) => {
  if (typeof value !== 'object') {
    return (value || '').toString().replace(/[\r\n\t]/g, ' ');
  }
  if (Array.isArray(value)) {
    let list;
    if (key.startsWith('in_')) {
      list = value.map(obj => obj.out['@rid'] || obj.out);
    } else if (key.startsWith('out_')) {
      list = value.map(obj => obj.in['@rid'] || obj.in);
    } else {
      list = value.map(obj => getTSVRepresentation(obj, key));
    }
    return list.join(', ');
  }
  if (key.includes('.')) {
    const newKey = key.split('.')[1];
    return getTSVRepresentation(value[newKey], newKey);
  }
  return castToExist(value);
};

/**
 * "Flattens" an object into a depth 1 object.
 * @param {Object} obj - Object to be flattened.
 *
 * @example
 * > const obj = {
 *     a: {
 *       b: 'e',
 *     },
 *     d: 'e',
 *   };
 *
 * > flatten(obj);
 * > {
 *     a[b]: 'e',
 *     d: 'e',
 *   }
 */
const flatten = (obj) => {
  const regex = /^[^[\]]+(?=(\[[^[\]]+\])*)/;
  const flattened = {};

  Object.keys(obj).forEach((key) => {
    let value = obj[key];
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object') {
        value = flatten(value);
        Object.keys(value).forEach((k) => {
          const flattenedKey = k.replace(regex, match => `${key}[${match}]`);
          flattened[flattenedKey] = value[k];
        });
      } else {
        flattened[key] = value;
      }
    }
  });
  return flattened;
};

/**
 * Prepares a payload to be sent to the server for a POST, PATCH, or GET
 * requst.
 * @param {Object} form - unprocessed form object containing user data.
 * @param {Array.<Object>} [properties=null] - List of valid properties for given
 * form.
 * @param {Array.<string>} [extraProps=[]] - List of extra parameters not specified
 * in objectSchema.
 * @param {boolean} [isQuery=false] - If true, object will be flattened in order to be
 * passed to qs.stringify.
 */
const parsePayload = (form, properties = null, extraProps = [], isQuery = false) => {
  const payload = properties ? {} : form;
  if (properties) {
    properties.forEach((prop) => {
      const {
        name,
        type,
        default: defaultValue,
        linkedClass,
      } = prop;
      if (type === 'link') {
        const formLink = form[`${name}.data`];
        if (formLink && formLink['@rid']) {
          payload[name] = formLink['@rid'];
        }
      } else if (type === 'embedded' && linkedClass && !linkedClass.isAbstract) {
        const { '@class': cls, ...embedded } = form[name];
        payload[name] = embedded;
      } else if (form[name] && !(defaultValue && form[name] === defaultValue)) {
        payload[name] = form[name];
      }
    });

    extraProps.forEach((name) => {
      if (form[name]) {
        payload[name] = form[name];
      }
    });
  }

  return isQuery ? flatten(payload) : payload;
};

/**
 * Returns pallette of colors for displaying objects of given type.
 * @param {number} n - number of elements in collection.
 * @param {string} type - object type ['link', 'node'].
 */
const getPallette = (n, type) => {
  const baseName = `${type.toUpperCase().slice(0, type.length - 1)}_COLORS`;
  if (n <= PALLETE_SIZE) {
    return config.GRAPH_DEFAULTS[baseName];
  }

  const list = config.GRAPH_DEFAULTS[baseName];
  for (let i = PALLETE_SIZE; i < n; i += 1) {
    const color = Math.round(Math.random() * (255 ** 3)).toString(16);
    list.push(`#${color.substr(color.length - 6)}`);
  }
  return list;
};

/**
 * Saves current graph state into localstorage, identified by the url search parameters.
 * @param {Object} search - collection of search parameters.
 * @param {Object} data - graph data to be stored.
 */
const loadGraphData = (search, data) => {
  const newData = Object.assign({ localStorageKey: search }, data);
  try {
    localStorage.setItem(GRAPH_OBJECTS, JSON.stringify(jc.decycle(newData)));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('localstorage quota exceeded');
  }
};

/**
 * Retrieves graph data from localstorage for the input search parameters.
 * @param {Object} search - collection of search parameters .
 */
const getGraphData = (search) => {
  const data = localStorage.getItem(GRAPH_OBJECTS);
  if (data) {
    const obj = jc.retrocycle(JSON.parse(data));
    if (obj.localStorageKey === search) {
      return obj;
    }
  }
  return null;
};

/**
 * Updates expandable map for input rid.
 * @param {Array.<string>} expandedEdgeTypes - List of valid edge type keys.
 * @param {Object} graphObjects - Collection of all graph objects.
 * @param {string} rid - identifier for input node.
 * @param {Object} expandable - Expandable flags map.
 */
const expanded = (expandedEdgeTypes, graphObjects, rid, expandable) => {
  const newExpandable = Object.assign({}, expandable);
  let targetFlag = false;
  expandedEdgeTypes.forEach((edge) => {
    if (graphObjects[rid][edge]) {
      graphObjects[rid][edge].forEach((l) => {
        if (!graphObjects[l['@rid'] || l]) {
          targetFlag = true;
        }
      });
    }
  });
  newExpandable[rid] = targetFlag;
  return newExpandable;
};

/**
 * Initializes group of nodes around input coordinates. Returns coordinate for
 * the i'th member of group of n elements.
 * @param {number} x - x coordinate of parent node.
 * @param {number} y - y coordinate of parent node.
 * @param {number} i - index of current element.
 * @param {number} n - total group size.
 */
const positionInit = (x, y, i, n) => {
  const newX = NODE_INIT_RADIUS * Math.cos((2 * Math.PI * i - Math.PI / 6) / n) + x;
  const newY = NODE_INIT_RADIUS * Math.sin((2 * Math.PI * i - Math.PI / 6) / n) + y;
  return { x: newX, y: newY };
};

/**
 * Parses permission value and converts to binary representation as a bit
 * array, LSD at index 0.
 *
 * @param {number} permissionValue - Permission value as a decimal value.
 *
 * @example
 * >parsePermission(7)
 * [1, 1, 1, 0]
 *
 * @example
 * >parsePermission(8)
 * [0, 0, 0, 1]
 */
const parsePermission = (permissionValue) => {
  let pv = permissionValue;
  const retstr = [0, 0, 0, 0];

  for (let i = 0; i < PERMISSIONS.length; i += 1) {
    if (pv % (2 ** (i + 1)) !== 0) {
      retstr[i] = 1;
      pv -= (2 ** i);
    }
  }
  return retstr;
};


/**
 * Returns a list of object class properties that are of a given type.
 * @param {Object} kbClass - Knowledgebase class object as defined in the schema.
 * @param {string} type - KB class type.
 */
const getPropOfType = (kbClass, type) => Object.values(kbClass)
  .filter(prop => prop.type === type);

/**
 * Sorting method to pass into Array.sort().
 * @param {Array.<string>} [order=[]] - order for props to be sorted in.
 * @param {string} [prop='name'] - nested property to sort objects by.
 */
const sortFields = (order = [], prop = 'name') => (a, b) => {
  const sortA = prop ? a[prop] : a;
  const sortB = prop ? b[prop] : b;
  if (order.indexOf(sortB) === -1) {
    return -1;
  }
  if (order.indexOf(sortA) === -1) {
    return 1;
  }
  return order.indexOf(sortA) < order.indexOf(sortB)
    ? -1
    : 1;
};

export default {
  antiCamelCase,
  expandEdges,
  getTSVRepresentation,
  parsePayload,
  getPallette,
  loadGraphData,
  getGraphData,
  expanded,
  positionInit,
  parsePermission,
  getPropOfType,
  castToExist,
  formatStr,
  shortenString,
  parseKBType,
  sortFields,
};
