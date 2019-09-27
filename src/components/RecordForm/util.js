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

export {
  CLASS_MODEL_PROP,
  FORM_VARIANT,
  sortAndGroupFields,
};
