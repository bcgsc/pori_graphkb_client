import util from './util';

let edges = [];

class Edge {
  constructor(data) {
    Object.keys(data).forEach((k) => { this[k] = data[k]; });
  }

  getId() {
    return this['@rid'];
  }
}

class Record {
  constructor(data) {
    Object.keys(data).forEach((k) => { this[k] = data[k]; });
  }

  static loadEdges(newEdges) {
    edges = util.expandEdges(newEdges);
  }

  getId() {
    return this['@rid'];
  }

  getEdges() {
    return edges.reduce((array, edge) => {
      if (this[edge] && this[edge].length > 0) {
        array.push(...this[edge].filter((e) => {
          const inRid = e.in['@rid'];
          const outRid = e.out['@rid'];
          return (inRid !== this.getId() || outRid !== this.getId())
            && e.in['@class'] !== 'Statement'
            && e.out['@class'] !== 'Statement';
        }));
      }
      return array;
    }, []);
  }

  getEdgeTypes() {
    return edges.reduce((array, edge) => {
      if (this[edge] && this[edge].length > 0 && !array.includes(this[edge][0]['@class'])) {
        array.push(this[edge][0]['@class']);
      }
      return array;
    }, []);
  }
}

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
   * Returns the editable properties of target ontology class.
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

  /**
  * Given a schema class object, find all other classes that inherit it.
  * @param {string} abstractClass - property class key.
  * @param {Object} schema - database schema
  */
  getSubClasses(abstractClass) {
    return Object.values(this.schema)
      .filter(kbClass => (kbClass.inherits || []).includes(abstractClass));
  }
}

export {
  Record,
  Edge,
  Schema,
};
