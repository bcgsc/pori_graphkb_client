/* eslint-disable */
/**
 * Formatting functions
 */
const moment = require('moment');
// const {RID} = require('orientjs');
const uuidValidate = require('uuid-validate');
const {AttributeError} = require('./error');


const castUUID = (uuid) => {
    if (uuidValidate(uuid, 4)) {
        return uuid;
    }
    throw new Error(`not a valid version 4 uuid ${uuid}`);
};


const timeStampNow = () => moment().valueOf();

/**
 *
 * @param {string} rid the putative @rid value
 * @param {boolean} [requireHash=true] if true the hash must be present
 * @returns {boolean} true if the string follows the expected format for an @rid, false otherwise
 *
 * @example
 * >>> looksLikeRID('#4:10', true);
 * true
 * @example
 * >>> looksLikeRID('4:0', true);
 * false
 * @example
 * >>> looksLikeRID('#4:10', false);
 * true
 * @example
 * >>> looksLikeRID('4:0', false);
 * true
 */
const looksLikeRID = (rid, requireHash = false) => {
    try {
        const pattern = requireHash
            ? /^#\d+:\d+$/
            : /^#?\d+:\d+$/;
        if (pattern.exec(rid.trim())) {
            return true;
        }
    } catch (err) { } // eslint-disable-line no-empty
    return false;
};


/**
 * Given an input object/estring, attemps to return the RID equivalent
 * @param string the input object
 * @returns {orientjs.RID} the record ID
 */
const castToRID = (string) => {
    if (string == null) {
        throw new AttributeError('cannot cast null/undefined to RID');
    }
    if (string) {
        return string;
    } if (typeof string === 'object' && string['@rid'] !== undefined) {
        return castToRID(string['@rid']);
    } if (looksLikeRID(string)) {
        return `#${string.replace(/^#/, '')}`;
    }
    throw new AttributeError({message: 'not a valid RID', value: string});
};


const castString = (string) => {
    if (string === null) {
        throw new AttributeError('cannot cast null to string');
    }
    return string.toString().toLowerCase().trim();
};


const castNullableString = x => (x === null
    ? null
    : castString(x));


const castNonEmptyString = (x) => {
    const result = x.toString().toLowerCase().trim();
    if (result.length === 0) {
        throw new AttributeError('Cannot be an empty string');
    }
    return result;
};


const castNonEmptyNullableString = x => (x === null
    ? null
    : castNonEmptyString(x));


const castNullableLink = (string) => {
    try {
        if (string === null || string.toString().toLowerCase() === 'null') {
            return null;
        }
    } catch (err) { }
    return castToRID(string);
};


const castDecimalInteger = (string) => {
    if (/^\d+$/.exec(string.toString().trim())) {
        return parseInt(string, 10);
    }
    throw new AttributeError(`${string} is not a valid decimal integer`);
};


const trimString = x => x.toString().trim();


const uppercase = x => x.toString().trim().toUpperCase();


const inheritProp = (obj, prop) => {
    for (const parent of obj._inherits) {
        if (parent[prop]) {
            return parent[prop];
        }
        if (inheritProp(parent, prop)) {
            return inheritProp(parent, prop);
        }
    }
    return null;
};

module.exports = {
    castDecimalInteger,
    castNullableLink,
    castNullableString,
    castNonEmptyString,
    castNonEmptyNullableString,
    castString,
    castToRID,
    castUUID,
    trimString,
    uppercase,
    timeStampNow,
    looksLikeRID,
    inheritProp
};
