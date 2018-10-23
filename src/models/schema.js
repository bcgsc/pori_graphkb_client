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
    return this.schema[cls] || null;
  }

  /**
   * Returns route and properties of a certain knowledgebase class
   * (most useful data).
   * @param {string} className - requested class name.
   */
  getClass(className) {
    const { schema } = this;
    const VPropKeys = schema.V ? Object.keys(schema.V.properties) : [];
    const classKey = (Object.keys(schema)
      .find(key => key.toLowerCase() === (className || '').toLowerCase()));
    if (!classKey) return null;
    const props = Object.keys(schema[classKey].properties)
      .filter(prop => !VPropKeys.includes(prop))
      .map(prop => schema[classKey].properties[prop]);
    return { route: schema[classKey].route, properties: props };
  }

  /**
 * Initializes a new instance of given kbClass.
 * @param {Object} model - existing model to keep existing values from.
 * @param {string} kbClass - Knowledge base class key.
 * @param {Object} schema - Knowledge base schema.
 */
  initModel(model, kbClass, extraProps = []) {
    const editableProps = kbClass
      && (this.getClass(kbClass) || {}).properties;
    if (!editableProps) return null;
    editableProps.push(...extraProps);
    const newModel = Object.assign({}, model);
    newModel['@class'] = kbClass;
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
          newModel[name] = (model[name] || '').name || '';
          newModel[`${name}.@rid`] = (model[name] || '')['@rid'] || '';
          newModel[`${name}.sourceId`] = (model[name] || '').sourceId || '';
          if (!linkedClass) {
            newModel[`${name}.class`] = (model[name] || '')['@class'] || '';
          }
          break;
        case 'integer' || 'long':
          newModel[name] = model[name] || min > 0 ? min : '';
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
              : this.initModel({}, property.linkedClass.name);
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
   * Returns all valid ontology types.
   */
  getOntologies() {
    const { schema } = this;
    const list = [];
    Object.keys(schema).forEach((key) => {
      if ((schema[key].inherits || []).includes('Ontology')) {
        list.push({ name: key, properties: schema[key].properties, route: schema[key].route });
      }
    });
    return list;
  }

  /**
   * Returns all valid edge types.
   */
  getEdges() {
    const { schema } = this;
    const list = [];
    Object.keys(schema).forEach((key) => {
      if (schema[key].inherits.includes('E')) {
        list.push(key);
      }
    });
    return list;
  }

  /**
   * Given a schema class object, determine whether it is abstract or not.
   * @param {string} linkedClass - property class key.
   * @param {Object} schema - database schema
   */
  isAbstract(linkedClass) {
    return Object.values(this.schema)
      .some(kbClass => (kbClass.inherits || []).includes(linkedClass));
  }

  isEdge(cls) {
    return (this.schema[cls].inherits || []).includes('E');
  }

  /**
  * Given a schema class object, find all other classes that inherit it.
  * @param {string} abstractClass - property class key.
  * @param {Object} schema - database schema
  */
  getSubClasses(abstractClass) {
    return Object.values(this.schema)
      .filter(kbClass => (kbClass.inherits || []).includes(abstractClass));
  }

  /**
 * Updates allColumns list with any new properties from ontologyTerm.
 * @param {Object} ontologyTerm - new node who's properties will be parsed.
 * @param {Array} allColumns - current list of all collected properties.
 * @param {Object} schema - api schema.
 */
  collectOntologyProps(ontologyTerm, allColumns) {
    const { schema } = this;
    const { properties } = this.getClass(ontologyTerm['@class'], schema);
    properties.forEach((prop) => {
      if (prop.name !== '@class' && !allColumns.includes(prop.name)) {
        if (ontologyTerm[prop.name]) {
          if (prop.type === 'link' || prop.type === 'embedded') {
            const nestedProperties = this.getClass(ontologyTerm[prop.name]['@class']).properties;
            if (prop.linkedClass && this.isAbstract(prop.linkedClass.name)) {
              nestedProperties.push({ name: '@class' });
            }
            (nestedProperties || []).forEach((nestedProp) => {
              if (
                ontologyTerm[prop.name][nestedProp.name]
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
