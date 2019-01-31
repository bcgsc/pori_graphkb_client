/**
 * Knowledgebase schema.
 */
class Schema {
  constructor(schema) {
    this.schema = schema;
  }

  /**
   * Returns Knowledgebase class schema.
   * @param {Object|string} obj - Record to fetch schema of.
   */
  get(obj) {
    let cls = obj;
    if (obj && typeof obj === 'object' && obj['@class']) {
      cls = obj['@class'];
    }
    return this.schema[cls];
  }

  /**
   * Returns preview of given object based on its '@class' value
   * @param {Object} obj - Record to be parsed.
   */
  getPreview(obj) {
    try {
      return this.schema[obj['@class']].getPreview(obj);
    } catch (err) {}  // eslint-disable-line
    try {
      return obj['@rid'];
    } catch (err) {} // eslint-disable-line
    return obj;
  }

  /**
   * Returns record metadata fields
   */
  getMetadata() {
    return Object.values(this.schema.V.properties);
  }

  /**
   * Returns route and properties of a certain knowledgebase class
   * (most useful data).
   * @param {Object|string} obj - Knowledgebase Record.
   * @param {Array.<string>} [extraProps=[]] - Extra props to be returned in the
   * class properties list.
   */
  getProperties(obj, extraProps = []) {
    const VPropKeys = this.schema.V.properties;
    if (obj && typeof obj === 'object') {
      obj = obj['@class'] || '';
    }
    const classModel = this.schema[obj];
    if (!classModel) return null;
    return Object.values(classModel.properties || [])
      .filter(prop => !VPropKeys[prop.name] || extraProps.includes(prop.name));
  }

  /**
   * Returns route and query properties of a certain knowledgebase class
   * (most useful data).
   * @param {string} className - requested class name.
   * @param {Array.<string>} [extraProps=[]] - Extra props to be returned in the
   * class properties list.
   */
  getQueryProperties(className, extraProps = []) {
    const { schema } = this;
    const VPropKeys = schema.V.properties;
    const classModel = this.get(className);
    if (!classModel) return null;
    return Object.values(classModel.queryProperties || [])
      .filter(prop => !VPropKeys[prop.name] || extraProps.includes(prop.name));
  }

  /**
   * Returns the URL route of a given class.
   * @param {string} className - schema class to return the route of.
   */
  getRoute(className) {
    return this.schema[className].routeName;
  }

  /**
   * Initializes a new instance of given kbClass.
   * @param {Object} model - existing model to keep existing values from.
   * @param {string} kbClass - Knowledge base class key.
   * @param {Array.<Object>} [opt.extraProps=[]] - Extra props to initialize on model.
   * @param {boolean} [opt.ignoreClass=false] - flag to omit '@class' prop on new model.
   * @param {boolean} [opt.stripProps=false] - flag to strip old props from model.
   * @param {boolean} [opt.isQuery=false] - flag to retreive queryproperties
   * from classmodel.
   */
  initModel(model, kbClass, opt = {}) {
    const {
      ignoreClass,
      stripProps,
      isQuery,
    } = opt;
    const extraProps = opt.extraProps || [];

    const editableProps = kbClass
      && (
        isQuery
          ? (this.getQueryProperties(kbClass, extraProps) || {})
          : (this.getProperties(kbClass, extraProps) || {}));
    if (!editableProps) return null;
    extraProps.forEach((prop) => { editableProps[prop.name] = prop; });
    const newModel = stripProps ? {} : Object.assign({}, model);
    newModel['@class'] = ignoreClass ? '' : this.get(kbClass).name;
    Object.values(editableProps).forEach((property) => {
      const {
        name,
        type,
        linkedClass,
        default: defaultValue,
      } = property;
      switch (type) {
        case 'embeddedset':
          newModel[name] = model[name] ? model[name].slice() : [];
          break;
        case 'link':
          if (model[`${name}.data`]) {
            newModel[`${name}.data`] = model[`${name}.data`];
          } else if (model[name] && model[name]['@class']) {
            newModel[`${name}.data`] = model[name];
          } else {
            newModel[`${name}.data`] = null;
          }
          newModel[name] = (newModel[`${name}.data`] && this.getPreview(newModel[`${name}.data`])) || '';
          break;
        case 'integer' || 'long':
          newModel[name] = model[name] !== undefined
            ? model[name]
            : '';
          break;
        case 'boolean':
          newModel[name] = model[name] !== undefined
            ? model[name]
            : (defaultValue || '').toString() === 'true';
          break;
        case 'embedded':
          if (linkedClass && linkedClass.properties) {
            newModel[name] = model[name]
              ? Object.assign({}, model[name])
              : this.initModel({}, linkedClass.name, {
                extraProps: [],
                ignoreClass: !!linkedClass.isAbstract,
                isQuery,
              });
          }
          break;
        default:
          newModel[name] = model[name] || '';
          break;
      }
    });
    return newModel;
  }

  /**
   * Returns all queryable classModels.
   */
  getQueryable(isAdmin) {
    const { schema } = this;
    return Object.values(schema).filter(model => model.expose
      && model.expose.QUERY
      && (isAdmin || !['User', 'UserGroup'].includes(model.name)));
  }

  /**
   * Returns subclasses of the given classmodel name.
   * @param {string} cls - class model name.
   * @param {boolean} subOnly - if true, does not return superclass model.
   */
  getSubclassesOf(cls, subOnly = false) {
    const { schema } = this;
    if (!schema[cls]) return null;
    const list = Object.values(schema)
      .filter(model => model.inherits && model.inherits.includes(cls));
    if (!subOnly) list.push(schema[cls]);
    return list;
  }

  /**
   * Returns all ontology types.
   * @param {boolean} [subOnly=false] - flag for checking only subclasses.
   */
  getOntologies(subOnly = false) {
    return this.getSubclassesOf('Ontology', subOnly);
  }

  /**
   * Returns all variant types.
   * @param {boolean} [subOnly=false] - flag for checking only subclasses.
   */
  getVariants(subOnly = false) {
    return this.getSubclassesOf('Variant', subOnly);
  }

  /**
   * Returns a list of strings containing all valid edge class names.
   * @param {Object} [node=null] - Object to retrieve edges from if input.
   */
  getEdges(node = null) {
    const { schema } = this;
    const list = schema.E.subclasses.slice().map(classModel => classModel.name);
    if (node) {
      const edges = [];
      Object.keys(node)
        .filter(key => key.split('_')[1] && list.includes(key.split('_')[1]))
        .forEach(key => edges.push(...node[key]));
      return edges;
    }

    return list;
  }

  /**
   * Checks if a ClassModel is a subclass of another ClassModel.
   * @param {string|Object} cls - ClassModel name of child
   * @param {string|Array.<string>} parentCls - ClassModel name of parent
   */
  isSubclass(cls, parentCls = []) {
    if (typeof parentCls === 'string') {
      parentCls = [parentCls];
    }


    return !!(this.get(cls)
      && this.get(cls).inherits.some(inherited => parentCls.includes(inherited)));
  }

  /**
   * Updates allColumns list with any new properties from a record.
   * @param {Object} record - new node who's properties will be parsed.
   * @param {Array.<string>} allColumns - current list of all collected properties.
   */
  collectOntologyProps(record, allColumns) {
    const properties = this.getProperties(record['@class']);
    properties.forEach((prop) => {
      if (!allColumns.includes(prop.name)) {
        if (record[prop.name]) {
          if (prop.type === 'link' || prop.type === 'embedded') {
            const nestedProperties = this.getProperties(record[prop.name]['@class']) || [];
            if (prop.linkedClass && prop.linkedClass.isAbstract) {
              nestedProperties.push({ name: '@class' });
            }
            nestedProperties.forEach((nestedProp) => {
              if (
                record[prop.name][nestedProp.name]
                && !allColumns.includes(`${prop.name}.${nestedProp.name}`)
              ) {
                allColumns.push(`${prop.name}.${nestedProp.name}`);
              }
            });
          } else {
            allColumns.push(prop.name);
          }
        }
      }
    });
    return allColumns;
  }
}

export default Schema;
