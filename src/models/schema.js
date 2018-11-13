import classes from './classes';

/**
 * Knowledgebase schema.
 */
class Schema {
  /**
   * Returns a list of object class properties that are of a given type.
   * @param {Object} kbClass - Knowledgebase class object as defined in the schema.
   * @param {string} type - KB class type.
   */
  static getPropOfType(kbClass, type) {
    return Object.values(kbClass)
      .filter(prop => prop.type === type);
  }

  constructor(schema) {
    this.schema = schema;
  }

  /**
   * Returns Knowledgebase class schema.
   * @param {string} cls - class name;
   */
  get(cls) {
    const match = Object.values(this.schema)
      .find(s => s.name.toLowerCase() === (cls || '').toLowerCase());
    return match || null;
  }

  /**
   * Returns route and properties of a certain knowledgebase class
   * (most useful data).
   * @param {string} className - requested class name.
   * @param {Array<string>} extraProps - Extra props to be returned in the
   * class properties list.
   */
  getClass(className, extraProps = []) {
    const { schema } = this;
    const VPropKeys = schema.V ? Object.keys(schema.V.properties) : [];
    const classKey = (Object.keys(schema)
      .find(key => key.toLowerCase() === (className || '').toLowerCase()));
    if (!classKey) return null;
    const props = Object.keys(schema[classKey].properties || [])
      .filter(prop => !VPropKeys.includes(prop) || extraProps.includes(prop))
      .map(prop => schema[classKey].properties[prop]);
    return { route: schema[classKey].route, properties: props };
  }

  /**
 * Initializes a new instance of given kbClass.
 * @param {Object} model - existing model to keep existing values from.
 * @param {string} kbClass - Knowledge base class key.
 * @param {Array} extraProps - Extra props to initialize on model.
 * @param {boolean} ignoreClass - flag to omit '@class' prop on new model.
 * @param {boolean} stripProps - flag to strip old props from model.
 */
  initModel(model, kbClass, extraProps = [], ignoreClass = false, stripProps = false) {
    const editableProps = kbClass
      && (this.getClass(kbClass, extraProps) || {}).properties;
    if (!editableProps) return null;
    editableProps.push(...extraProps);
    const newModel = stripProps ? {} : Object.assign({}, model);
    newModel['@class'] = ignoreClass ? '' : kbClass;
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
          newModel[name] = model[name] ? model[name].slice() : [];
          break;
        case 'link':
          if (model[`${name}.data`]) {
            newModel[`${name}.data`] = this.newRecord(model[`${name}.data`]);
          } else if (model[name] && model[name]['@class']) {
            newModel[`${name}.data`] = this.newRecord(model[name]);
          } else {
            newModel[`${name}.data`] = null;
          }
          newModel[name] = (newModel[`${name}.data`] && newModel[`${name}.data`].getPreview()) || '';
          break;
        case 'integer' || 'long':
          newModel[name] = model[name] !== undefined
            ? model[name]
            : min || '';
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
              : this.initModel({}, linkedClass.name, [], true);
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
   * Returns all ontology types.
   * @param {boolean} subOnly - flag for checking only subclasses.
   */
  getOntologies(subOnly) {
    const { schema } = this;
    const list = [];
    Object.keys(schema).forEach((key) => {
      if (this.isOntology(key, subOnly)) {
        list.push({ name: key, properties: schema[key].properties, route: schema[key].route });
      }
    });
    return list;
  }

  /**
   * Returns all variant types.
   * @param {boolean} subOnly - flag for checking only subclasses.
   */
  getVariants(subOnly) {
    const { schema } = this;
    const list = [];
    Object.keys(schema).forEach((key) => {
      if (this.isVariant(key, subOnly)) {
        list.push({ name: key, properties: schema[key].properties, route: schema[key].route });
      }
    });
    return list;
  }

  /**
   * Returns a list of strings containing all valid edge class names.
   */
  getEdges() {
    const { schema } = this;
    const list = [];
    Object.keys(schema).forEach((key) => {
      if ((schema[key].inherits || []).includes('E')) {
        list.push(key);
      }
    });
    return list;
  }

  /**
   * Given a schema class object, determine whether it is abstract or not.
   * @param {string} linkedClass - property class key.
   */
  isAbstract(linkedClass) {
    return Object.values(this.schema)
      .some(kbClass => (kbClass.inherits || []).includes(linkedClass));
  }

  /**
   * Checks if a KB class is an edge.
   * @param {string} cls - class key.
   * @param {boolean} subOnly - flag for checking only subclasses.
   */
  isEdge(cls, subOnly) {
    return this.isOfType(cls, 'E', subOnly);
  }

  /**
   * Checks if a KB class is an Ontology.
   * @param {string} cls - class key.
   * @param {boolean} subOnly - flag for checking only subclasses.
   */
  isOntology(cls, subOnly) {
    return this.isOfType(cls, 'Ontology', subOnly);
  }

  /**
   * Checks if a KB class is a Position.
   * @param {string} cls - class key.
   * @param {boolean} subOnly - flag for checking only subclasses.
   */
  isPosition(cls, subOnly) {
    return this.isOfType(cls, 'Position', subOnly);
  }

  /**
   * Checks if a KB class is a Variant.
   * @param {string} cls - class key.
   * @param {boolean} subOnly - flag for checking only subclasses.
   */
  isVariant(cls, subOnly) {
    return this.isOfType(cls, 'Variant', subOnly);
  }

  /**
   * Checks if class is of given abstract type.
   * @param {string} cls - class string to be checked.
   * @param {string} type - supertype string.
   * @param {boolean} subOnly - flag for checking only subclasses.
   */
  isOfType(cls, type, subOnly = false) {
    return (this.get(cls) && (this.get(cls).inherits || []).includes(type))
      || (cls === type && !subOnly);
  }

  /**
  * Given a schema class object, find all other classes that inherit it.
  * @param {string} abstractClass - property class key.
  */
  getSubClasses(abstractClass) {
    return Object.values(this.schema)
      .filter(kbClass => (kbClass.inherits || []).includes(abstractClass));
  }

  /**
   * Updates allColumns list with any new properties from ontologyTerm.
   * @param {Object} term - new node who's properties will be parsed.
   * @param {Array} allColumns - current list of all collected properties.
   */
  collectOntologyProps(term, allColumns) {
    const { schema } = this;
    const { properties } = this.getClass(term['@class'], schema);
    properties.forEach((prop) => {
      if (!allColumns.includes(prop.name)) {
        if (term[prop.name]) {
          if (prop.type === 'link' || prop.type === 'embedded') {
            const nestedProperties = this.getClass(term[prop.name]['@class']).properties;
            if (prop.linkedClass && this.isAbstract(prop.linkedClass.name)) {
              nestedProperties.push({ name: '@class' });
            }
            (nestedProperties || []).forEach((nestedProp) => {
              if (
                term[prop.name][nestedProp.name]
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

  /**
   * Parses an input object and casts it to a KB class.
   * @param {Object} obj - input object to be parsed.
   * @param {boolean} ignoreNested - stop flag for recursive child construction.
   */
  newRecord(obj, ignoreNested = false) {
    if (obj) {
      if (obj['@class']) {
        if (classes[obj['@class']]) {
          return new classes[obj['@class']](obj, this, ignoreNested);
        }
        if (this.isEdge(obj['@class'])) {
          return new classes.Edge(obj, this, ignoreNested);
        }
        if (this.isOntology(obj['@class'])) {
          return new classes.Ontology(obj, this, ignoreNested);
        }
        if (this.isPosition(obj['@class'])) {
          return new classes.Position(obj, this, ignoreNested);
        }
        if (this.isVariant(obj['@class'])) {
          return new classes.Variant(obj, this, ignoreNested);
        }
        return new classes.V(obj, this, ignoreNested);
      }
      return new classes.Record(obj, this, ignoreNested);
    }
    return null;
  }

  /**
   * Returns class object for given class.
   * @param {string} cls - Class string.
   */
  getClassConstructor(cls) {
    if (classes[cls]) {
      return classes[cls];
    }
    if (this.isEdge(cls)) {
      return classes.Edge;
    }
    if (this.isOntology(cls)) {
      return classes.Ontology;
    }
    if (this.isPosition(cls)) {
      return classes.Position;
    }
    if (this.isVariant(cls)) {
      return classes.Variant;
    }
    return classes.V;
  }
}

export default Schema;
