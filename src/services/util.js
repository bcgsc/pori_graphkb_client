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
}
