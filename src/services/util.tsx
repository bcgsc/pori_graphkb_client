/**
 * Handles miscellaneous tasks.
 */

import { useHistory, useLocation } from 'react-router-dom';

import { GeneralRecordType } from '@/components/types';
import config from '@/static/config';

const {
  GRAPH_DEFAULTS,
  GRAPH_PROPERTIES: { NODE_INIT_RADIUS },
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

/**
 * Casts a value to string form with minimal formatting. Sets the value to
 * 'null' if the value is null or undefined.
 * @param {any} obj - Object to be formatted.
 */
const castToExist = (obj): string => {
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
      words[i] = word.replace(re, (match) => match.toUpperCase());
    });
  });
  return words.join(' ');
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
    const newWords = word.replace(/[A-Z]+|[0-9]+/g, (match) => ` ${match}`);

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
    .replace(newSentence, (match) => match.toUpperCase());
  return ret;
};

/**
 * Expands edges to field property names, with either 'in_' or 'out_'
 * appended to them.
 * @param {Array.<string>} edges - list of edge classes.
 */
const expandEdges = (edges) => edges.reduce((r, edge) => {
  r.push(`in_${edge}`);
  r.push(`out_${edge}`);
  return r;
}, []);

/**
 * Returns pallette of colors for displaying objects of given type.
 * @param {number} n - number of elements in collection.
 * @param {string} type - object type ['links', 'nodes'].
 */
const getPallette = (n, type = 'nodes') => {
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
 * navigates to error view and saves previous locaton to history object so that
 * after login, the user is redirected back to the previous page they were on
 *
 * @param {object} error error object containing message and error name
 * @param {object} history history object for navigation
 * @param {object} referrerLocation location of application before handling error
 */
const handleErrorSaveLocation = (error: Error, history: ReturnType<typeof useHistory>, referrerLocation: Partial<ReturnType<typeof useLocation>> | null = null) => {
  const { name, message } = error;
  const { location: { pathname, search } } = history;

  const savedState = {
    from: {
      pathname: referrerLocation ? referrerLocation.pathname : pathname,
      search: referrerLocation ? referrerLocation.search : search,
    },
    error: { name, message },
  };

  history.push({
    pathname: '/error',
    state: savedState,
  });
};

/**
 * Formats RecordExistsError to have a better message instead of raw output from console
 * Returns raw output only if targeted regex does not match
 * @param {object} error error object containing message and error name
 */
const massageRecordExistsError = (error) => {
  const { message } = error;

  try {
    const [, incomingRecord] = /previously assigned to the record\s*(#[\d]*:[\d]*)/gi.exec(message);
    const [, existingRecord] = /Cannot index record\s*(#[\d]*:[\d]*)/gi.exec(message);

    if (incomingRecord && existingRecord) {
      return `Cannot modify record ${incomingRecord} because record ${existingRecord} exists with the same parameters.`;
    }
  } catch {
    return message;
  }
  return message;
};

const hashRecordsByRID = (data: GeneralRecordType[]) => {
  const newData: Record<string, GeneralRecordType> = {};
  data.forEach((obj) => {
    if (obj) {
      newData[obj['@rid']] = obj;
    }
  });
  return newData;
};

export default {
  hashRecordsByRID,
  antiCamelCase,
  expandEdges,
  getPallette,
  handleErrorSaveLocation,
  expanded,
  positionInit,
  formatStr,
  parseKBType,
  massageRecordExistsError,
};
