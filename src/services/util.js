import config from '../config.json';

const { DEFAULT_PROPS } = config;
const acronyms = ['id', 'uuid', 'ncit', 'uberon', 'doid', 'url'];


/**
 * Handles miscellaneous tasks.
 */
export default class util {
  /**
   * Returns plural version of input string in all lower case.
   * @param {string} str - string to be pluralized
   */
  static pluralize(str) {
    const retstr = str.toLowerCase();
    if (
      retstr.endsWith('y')
      && !['a', 'e', 'i', 'o', 'u', 'y'].includes(retstr[retstr.length - 2])
    ) {
      return `${retstr.slice(0, retstr.length - 1)}ies`;
    }
    return `${retstr}s`;
  }

  /**
   * Un-camelCase's input string.
   * @param {string} str - camelCase'd string.
   */
  static antiCamelCase(str) {
    let accstr = str;
    if (accstr.startsWith('@')) accstr = accstr.slice(1);
    let words = [accstr];
    if (accstr.includes('.')) {
      words = accstr.split('.');
    }

    words.forEach((word, i) => {
      words[i] = (word.charAt(0).toUpperCase() + word.slice(1))
        .replace(/[A-Z]/g, match => ` ${match}`).trim();
    });

    accstr = words.join(' ');
    acronyms.forEach((acronym) => {
      const re = new RegExp(acronym, 'ig');
      accstr = accstr.replace(re, match => match.toUpperCase());
    });
    return accstr.trim();
  }

  /**
   * Returns a representative field of a given object. Defaults to:
   * sourceId, then name, then if neither are present, the first primitive
   * type field in the object.
   * @param {Object} obj - target data object.
   */
  static getPreview(obj) {
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
    return preview;
  }

  /**
   * Formatter meant for edge types given in the form:
   * '['in' | 'out']_[edgeType]'.
   *
   *    Format string:  in_[edgeType] => has[edgeType]
   *                    out_[edgeType] => [edgeType]
   *
   * @param {string} str - string to be formatted.
   */
  static getEdgeLabel(str) {
    if (str.startsWith('in_')) {
      return `has${str.split('_')[1].slice(0, str.split('_')[1].length - 2)}`;
    }
    if (str.startsWith('out_')) {
      return `${str.split('_')[1]}`;
    }
    return str;
  }

  /**
   * Returns the plaintext representation of a value in order to be loaded into
   * a TSV file. Parses nested objects and arrays using the key as reference.
   * @param {any} value - Value
   * @param {string} key - Object Key.
   */
  static getTSVRepresentation(value, key) {
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
        list = value.map(obj => this.getTSVRepresentation(obj, key));
      }
      return list.join(', ');
    }
    if (key.includes('.')) {
      const newKey = key.split('.')[1];
      return this.getTSVRepresentation(value[newKey], newKey);
    }
    return this.getPreview(value);
  }

  /**
   * Prepares a payload to be sent to the server for a POST, PATCH, or GET requst.
   * @param {Object} form - unprocessed form object containing user data.
   * @param {*} editableProps - List of valid properties for given form.
   * @param {*} exceptions - List of extra parameters not specified in editableProps.
   */
  static parsePayload(form, editableProps, exceptions) {
    const payload = Object.assign({}, form);
    Object.keys(payload).forEach((key) => {
      if (!payload[key]) delete payload[key];
      // For link properties, must specify record id being linking to. Clear the rest.
      if (key.includes('.@rid')) {
        // Sets top level property to the rid: ie.
        // 'source.@rid': #18:5 => 'source': #18:5
        payload[key.split('.')[0]] = payload[key];
        delete payload[key];
      }
      // Clears out all other unknown fields.
      if (!editableProps.find(p => p.name === key)) {
        if (!exceptions || !exceptions.find(p => p.name === key)) {
          delete payload[key];
        }
      }
    });
    return payload;
  }

  static chooseColor(i, n) {
    let pallette = [];

    if (n <= 5) {
      pallette = config.GRAPH_DEFAULTS.NODE_COLORS_5;
    }
    if (n <= 10) {
      pallette = config.GRAPH_DEFAULTS.NODE_COLORS_10;
    }
    if (n <= 15) {
      pallette = config.GRAPH_DEFAULTS.NODE_COLORS_15;
    }
    if (n <= 20) {
      pallette = config.GRAPH_DEFAULTS.NODE_COLORS_20;
    }

    if (i < pallette.length) {
      return pallette[i];
    }

    return Math.round(Math.random() * (255 ** 3)).toString(16);
  }

  static getPallette(n, type) {
    if (n < 5) {
      return config.GRAPH_DEFAULTS[`${type.toUpperCase().slice(0, type.length - 1)}_COLORS_5`];
    }
    if (n < 10) {
      return config.GRAPH_DEFAULTS[`${type.toUpperCase().slice(0, type.length - 1)}_COLORS_10`];
    }
    if (n < 15) {
      return config.GRAPH_DEFAULTS[`${type.toUpperCase().slice(0, type.length - 1)}_COLORS_15`];
    }
    if (n < 20) {
      return config.GRAPH_DEFAULTS[`${type.toUpperCase().slice(0, type.length - 1)}_COLORS_20`];
    }
    const list = config.GRAPH_DEFAULTS[`${type.toUpperCase().slice(0, type.length - 1)}_COLORS_20`];
    for (let i = 20; i < n; i += 1) {
      const color = `000000${Math.round(Math.random() * (255 ** 3)).toString(16)}`;
      list.push(`#${color.substr(color.length - 6)}`);
    }
    return list;
  }

  /**
   * Updates allColumns list with any new properties from ontologyTerm.
   * @param {Object} ontologyTerm - new node who's properties will be parsed.
   * @param {Array} allColumns - current list of all collected properties.
   * @param {Object} schema - api schema.
   */
  static collectOntologyProps(ontologyTerm, allColumns, schema) {
    const { properties } = schema[ontologyTerm['@class']];
    const { V } = schema;
    Object.keys(ontologyTerm).forEach((prop) => {
      if (!V.properties[prop] && prop !== '@class' && !allColumns.includes(prop)) {
        const endpointProp = properties[prop];
        if (endpointProp && endpointProp.type === 'link') {
          Object.keys(ontologyTerm[prop]).forEach((nestedProp) => {
            if (
              !V.properties[nestedProp]
              && !allColumns.includes(`${prop}.${nestedProp}`)
              && !nestedProp.startsWith('in_')
              && !nestedProp.startsWith('out_')
              && !(endpointProp.linkedClass && nestedProp === '@class')
              && (properties[nestedProp] || {}).type !== 'link'
            ) {
              allColumns.push(`${prop}.${nestedProp}`);
            }
          });
        } else {
          allColumns.push(prop);
        }
      }
    });
    return allColumns;
  }

  /**
    * Returns all valid ontology types.
    */
  static getOntologies(schema) {
    const list = [];
    Object.keys(schema).forEach((key) => {
      if (schema[key].inherits.includes('Ontology')) {
        list.push({ name: key, properties: schema[key].properties });
      }
    });
    return list;
  }

  /**
    * Returns all valid edge types.
    */
  static getEdges(schema) {
    const list = [];
    Object.keys(schema).forEach((key) => {
      if (schema[key].inherits.includes('E')) {
        list.push(key);
      }
    });
    return list;
  }
}
