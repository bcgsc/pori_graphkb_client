
const propOrder = ['sourceId', 'name'];
const acronyms = ['id', 'uuid', 'ncit', 'uberon', 'doid'];


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
    accstr = (accstr.charAt(0).toUpperCase() + accstr.slice(1))
      .replace(/[A-Z]/g, match => ` ${match}`);
    acronyms.forEach((acronym) => {
      const re = new RegExp(acronym, 'ig');
      accstr = accstr.replace(re, match => match.toUpperCase());
    });
    return accstr;
  }

  /**
   * Returns a representative field of a given object. Defaults to:
   * sourceId, then name, then if neither are present, the first primitive
   * type field in the object.
   * @param {Object} obj - target data object.
   */
  static getPreview(obj) {
    let preview;
    propOrder.forEach((prop) => {
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
      return value || '';
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

  static parsePayload(form, editableProps) {
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
        delete payload[key];
      }
    });
    return payload;
  }

  static chooseColor(x, n) {
    const i = Math.floor(x / n * 12);
    const y = Math.round(x / n * 12 * 255) - i * 255;

    if (i < 1) {
      return `rgb(255, 0, ${y})`;
    }
    if (i < 2) {
      return `rgb(255, ${y}, 0)`;
    }
    if (i < 3) {
      return `rgb(255, ${y}, 255)`;
    }
    if (i < 4) {
      return `rgb(${y}, 0, 255)`;
    }
    if (i < 5) {
      return `rgb(255, 255, ${y})`;
    }
    if (i < 6) {
      return `rgb(${y}, 255, 0)`;
    }
    if (i < 7) {
      return `rgb(0, 255, ${y})`;
    }
    if (i < 8) {
      return `rgb(${y}, 255, 255)`;
    }
    if (i < 9) {
      return `rgb(0, ${y}, 255)`;
    }
    if (i < 10) {
      return `rgb(0, ${y}, 0)`;
    }
    if (i < 11) {
      return `rgb(0, 0, ${y})`;
    }
    if (i < 12) {
      return `rgb(${y}, 0, 0)`;
    }
    return '#000';
  }
}
