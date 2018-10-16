/**
 * Handles miscellaneous tasks.
 * @module /services/util
 */

import * as jc from 'json-cycle';
import config from '../config.json';

const { DEFAULT_PROPS, PERMISSIONS } = config;
const { PALLETE_SIZE } = config.GRAPH_DEFAULTS;
const { NODE_INIT_RADIUS } = config.GRAPH_PROPERTIES;
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
];

const GRAPH_OBJECTS_KEY = 'graphObjects';
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
  return obj === undefined || obj === null ? 'null' : obj.toString();
};

/**
 * Parses a string and capitalizes known acronyms.
 * @param {string | Array<string>} str - String to be parsed.
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
  if (typeof obj === 'object') {
    if (Object.keys(obj).includes('@rid')) {
      return 'link';
    }
    return 'embedded';
  }
  return 'string';
};

const formatStr = (str) => {
  const newSentence = /\.\s\w/g;
  const ret = parseAcronyms(castToExist(str))
    .trim()
    .replace(newSentence, match => match.toUpperCase());
  return ret.charAt(0).toUpperCase() + ret.slice(1);
};

/**
 * Returns a representative field of a given object. Defaults to:
 * name, then sourceId (defined in config.json: DEFAULT_PROPS), then if
 * neither are present, the first primitive type field in the object.
 * @example
 * > util.getPreview({name: 'bob', ...other})
 * > 'bob'
 * @example
 * > util.getPreview({sourceId: '123', color: 'blue'})
 * > '123'
 * @example
 * > util.getPreview({colors: ['red', 'green], height: '6ft'})
 * > '6ft'
 * @param {Object} obj - target data object.
 */
const getPreview = (obj) => {
  let preview;
  DEFAULT_PROPS.forEach((prop) => {
    if (obj[prop]) {
      if (!preview) {
        preview = obj[prop];
      }
    }
  });
  if (!preview) {
    const prop = Object.keys(obj).find(key => typeof obj[key] !== 'object');
    preview = obj[prop];
  }
  return formatStr(preview);
};

/**
 * Expands edges to field property names, with either 'in_' or 'out_'
 * appended to them.
 * @param {Array} edges - list of edge classes.
 */
const expandEdges = edges => edges.reduce((r, e) => {
  r.push(`in_${e}`);
  r.push(`out_${e}`);
  return r;
}, []);

/**
 * Formatter meant for edge types given in the form:
 * '['in' | 'out']_[edgeType]'.
 *
 *    Format string:  in_[edgeType] => has[edgeType]
 *                    out_[edgeType] => [edgeType]
 *
 * @param {string} str - string to be formatted.
 */
const getEdgeLabel = (str) => {
  const edgeType = str.split('_')[1];
  let retstr = edgeType || str;

  if (str.startsWith('in_')) {
    switch (edgeType.slice(edgeType.length - 2, edgeType.length)) {
      case 'By':
        if (
          ['a', 'e', 'i', 'o', 'u', 'y']
            .includes(edgeType.slice(edgeType.length - 6, edgeType.length - 5))
        ) {
          retstr = `${edgeType.slice(0, edgeType.length - 3)}s`;
        } else {
          retstr = `${edgeType.slice(0, edgeType.length - 4)}s`;
        }
        break;
      case 'Of':
        retstr = `has${edgeType.slice(0, edgeType.length - 2)}`;
        break;
      case 'es':
        retstr = `${edgeType.slice(0, edgeType.length - 1)}dBy`;
        break;
      case 'rs':
        retstr = `${edgeType.slice(0, edgeType.length - 1)}redBy`;
        break;
      default:
        break;
    }
  }
  return retstr;
};

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
  return getPreview(value);
};

/**
 * Prepares a payload to be sent to the server for a POST, PATCH, or GET requst.
 * @param {Object} form - unprocessed form object containing user data.
 * @param {Array} objectSchema - List of valid properties for given form.
 * @param {Array} exceptions - List of extra parameters not specified in editableProps.
 */
const parsePayload = (form, objectSchema, exceptions) => {
  const payload = Object.assign({}, form);
  Object.keys(payload).forEach((key) => {
    if (!payload[key]) delete payload[key];
    // For link properties, must specify record id being linking to. Clear the rest.
    if (key.includes('.@rid')) {
      const nestedKey = key.split('.')[0];
      if (
        (objectSchema.find(p => p.name === nestedKey)
          || (exceptions && exceptions.find(p => p.name === nestedKey)))
        && payload[key]
      ) {
        // Sets top level property to the rid: ie.
        // 'source.@rid': #18:5 => 'source': #18:5
        payload[key.split('.')[0]] = payload[key];
        delete payload[key];
      }
    }
    // Clears out all other unknown fields.
    if (!objectSchema.find(p => p.name === key)) {
      if (!exceptions || !exceptions.find(p => p.name === key)) {
        delete payload[key];
      }
    }
  });
  return payload;
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
  const newData = Object.assign({ filteredSearch: search }, data);
  try {
    localStorage.setItem(GRAPH_OBJECTS_KEY, JSON.stringify(jc.decycle(newData)));
  } catch (e) {
    console.error('localstorage quota exceeded');
  }
};

/**
 * Retrieves graph data from localstorage for the input search parameters.
 * @param {Object} search - collection of search parameters .
 */
const getGraphData = (search) => {
  const data = localStorage.getItem(GRAPH_OBJECTS_KEY);
  if (data) {
    const obj = jc.retrocycle(JSON.parse(data));
    if (obj.filteredSearch === search) {
      return obj;
    }
  }
  return null;
};

/**
 * Updates expandable map for input rid.
 * @param {Array} expandedEdgeTypes - List of valid edge types.
 * @param {Object} graphObjects - Collection of all graph objects.
 * @param {string} rid - identifier for input node.
 * @param {Object} expandable - Expandable flags map.
 */
const expanded = (expandedEdgeTypes, graphObjects, rid, expandable) => {
  const newExpandable = Object.assign({}, expandable);
  let targetFlag = false;
  expandedEdgeTypes.forEach((e) => {
    if (graphObjects[rid][e]) {
      graphObjects[rid][e].forEach((l) => {
        if (
          !graphObjects[l['@rid'] || l]
          && !((l.in || {})['@class'] === 'Statement' || (l.out || {})['@class'] === 'Statement')
        ) {
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
 * Returns the editable properties of target ontology class.
 * @param {string} className - requested class name
 */
const getClass = (className, schema) => {
  const VPropKeys = schema.V ? Object.keys(schema.V.properties) : [];
  const classKey = (Object.keys(schema)
    .find(key => key.toLowerCase() === (className || '').toLowerCase()));
  if (!classKey) return {};
  const props = Object.keys(schema[classKey].properties)
    .filter(prop => !VPropKeys.includes(prop))
    .map(prop => schema[classKey].properties[prop]);
  return { route: schema[classKey].route, properties: props };
};

/**
 * Initializes a new instance of given kbClass.
 * @param {Object} model - existing model to keep existing values from.
 * @param {string} kbClass - Knowledge base class key.
 * @param {Object} schema - Knowledge base schema.
 */
const initModel = (model, kbClass, schema) => {
  const editableProps = schema && kbClass
    ? (getClass(kbClass, schema)).properties
    : [];
  const newModel = Object.assign({}, model);
  newModel['@class'] = kbClass;
  Object.values(editableProps).forEach((property) => {
    const {
      name,
      type,
      linkedClass,
      min,
    } = property;
    const defaultValue = property.default;
    switch (type) {
      case 'embeddedset':
        newModel[name] = model[name] || [];
        break;
      case 'link':
        newModel[name] = (model[name] || '').name || '';
        newModel[`${name}.@rid`] = (model[name] || '')['@rid'] || '';
        newModel[`${name}.sourceId`] = (model[name] || '').sourceId || '';
        if (!linkedClass) {
          newModel[`${name}.class`] = (model[name] || '')['@class'] || '';
        }
        break;
      case 'integer' || 'long':
        newModel[name] = model[name] || min > 0 ? min : '';
        break;
      case 'boolean':
        newModel[name] = model[name] !== undefined
          ? model[name]
          : (defaultValue || '').toString() === 'true';
        break;
      case 'embedded':
        if (linkedClass && linkedClass.properties) {
          newModel[name] = model[name] || initModel({}, property.linkedClass.properties);
        }
        break;
      default:
        newModel[name] = model[name] || '';
        break;
    }
  });
  return newModel;
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
  * Returns all valid ontology types.
  */
const getOntologies = (schema) => {
  const list = [];
  Object.keys(schema).forEach((key) => {
    if ((schema[key].inherits || []).includes('Ontology')) {
      list.push({ name: key, properties: schema[key].properties, route: schema[key].route });
    }
  });
  return list;
};

/**
* Given a schema class object, determine whether it is abstract or not.
* @param {string} linkedClass - property class key.
* @param {Object} schema - database schema
*/
const isAbstract = (linkedClass, schema) => Object.values(schema)
  .some(kbClass => (kbClass.inherits || []).includes(linkedClass));

/**
* Given a schema class object, find all other classes that inherit it.
* @param {string} abstractClass - property class key.
* @param {Object} schema - database schema
*/
const getSubClasses = (abstractClass, schema) => Object.values(schema)
  .filter(kbClass => (kbClass.inherits || []).includes(abstractClass));

/**
 * Returns a list of object class properties that are of a given type.
 * @param {Object} kbClass - Knowledgebase class object as defined in the schema.
 * @param {string} type - KB class type.
 */
const getPropOfType = (kbClass, type) => Object.values(kbClass)
  .filter(prop => prop.type === type);

const sortFields = (order = []) => (a, b) => {
  if (order.indexOf(b.name) === -1) {
    return -1;
  }
  if (order.indexOf(a.name) === -1) {
    return 1;
  }
  return order.indexOf(a.name) < order.indexOf(b.name)
    ? -1
    : 1;
};

export default {
  antiCamelCase,
  getPreview,
  expandEdges,
  getEdgeLabel,
  getTSVRepresentation,
  parsePayload,
  getPallette,
  loadGraphData,
  getGraphData,
  expanded,
  positionInit,
  initModel,
  getClass,
  isAbstract,
  getSubClasses,
  parsePermission,
  getPropOfType,
  castToExist,
  formatStr,
  shortenString,
  parseKBType,
  getOntologies,
  sortFields,
};
