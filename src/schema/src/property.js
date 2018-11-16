/* eslint-disable */
const {AttributeError} = require('./error');

const {
    castDecimalInteger,
    castNonEmptyNullableString,
    castNonEmptyString,
    castNullableString,
    castToRID,
    castNullableLink,
    castString
} = require('./util');


class Property {
    /**
     * create a new property
     *
     * @param {Object} opt options
     * @param {string} opt.name the property name
     * @param {*|Function} opt.default the default value or function for generating the default
     * @param {string} opt.pattern the regex pattern values for this property should follow (used purely in docs)
     * @param {boolean} opt.nullable flag to indicate if the value can be null
     * @param {boolean} opt.mandatory flag to indicate if this property is required
     * @param {boolean} opt.nonEmpty for string properties indicates that an empty string is invalid
     * @param {string} opt.description description for the openapi spec
     * @param {ClassModel} opt.linkedClass if applicable, the class this link should point to or embed
     * @param {Array} opt.choices enum representing acceptable values
     * @param {Number} opt.min minimum value allowed (for intger type properties)
     * @param {Number} opt.max maximum value allowed (for integer type properties)
     * @param {Function} opt.cast the function to be used in formatting values for this property (for list properties it is the function for elements in the list)
     *
     * @return {Property} the new property
     */
    constructor(opt) {
        if (!opt.name) {
            throw new AttributeError('name is a required parameter');
        }
        this.name = opt.name;
        if (opt.default !== undefined) {
            if (opt.default instanceof Function) {
                this.generateDefault = opt.default;
            } else {
                this.default = opt.default;
            }
        }
        this.pattern = opt.pattern;
        this.generated = !!opt.generated;
        this.type = opt.type || 'string';
        this.cast = opt.cast;
        this.description = opt.description;
        this.nullable = opt.nullable === undefined
            ? true
            : !!opt.nullable;
        this.mandatory = !!opt.mandatory; // default false
        this.nonEmpty = !!opt.nonEmpty;

        this.iterable = !!/(set|list|bag|map)/ig.exec(this.type);
        this.linkedClass = opt.linkedClass;
        this.min = opt.min;
        this.max = opt.max;
        this.choices = opt.choices;
        if (!this.cast) { // set the default cast functions
            if (this.type === 'integer') {
                this.cast = castDecimalInteger;
            } else if (this.type === 'string') {
                if (!this.nullable) {
                    this.cast = this.nonEmpty
                        ? castNonEmptyString
                        : castString;
                } else {
                    this.cast = this.nonEmpty
                        ? castNonEmptyNullableString
                        : castNullableString;
                }
            } else if (this.type.includes('link')) {
                if (!this.nullable) {
                    this.cast = castToRID;
                } else {
                    this.cast = castNullableLink;
                }
            }
        }
    }
}

module.exports = {Property};
