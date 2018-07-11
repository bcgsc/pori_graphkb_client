
const propOrder = ['sourceId', 'name'];


/**
 * Handles miscellaneous tasks.
 */
export default class util {
  /**
   * Returns plural version of input string.
   * @param {string} str - string to be pluralized
   */
  static pluralize(str) {
    if (
      str.endsWith('y')
      && !['a', 'e', 'i', 'o', 'u', 'y'].includes(str[str.length - 2])
    ) {
      return `${str.slice(0, str.length - 1)}ies`;
    }
    return `${str}s`;
  }

  /**
   * Un-camelCase's input string.
   */
  static antiCamelCase(str) {
    let accstr = str;
    if (accstr.startsWith('@')) accstr = accstr.slice(1);
    accstr = accstr.charAt(0).toUpperCase() + accstr.slice(1);
    return accstr.replace(/[A-Z]/g, match => ` ${match}`);
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
      const prop = Object.keys(obj).filter(key => typeof obj[key] !== 'object')[0];
      preview = obj[prop];
    }
    return preview;
  }

  /**
   * Formatter meant for edge types with given in the form:
   * '['in' | 'out']_[edgeType]'.
   *
   *    Format string:  in_[edgeType] => has[edgeType]
   *    out_[edgeType] => [edgeType]
   *
   * @param {string} str - string to be formatted.
   */
  static getEdgeLabel(str) {
    const edgeType = str.split('_')[1];
    return str.startsWith('in_')
      ? `has${edgeType.slice(0, edgeType.length - 2)}`
      : edgeType;
  }
}
