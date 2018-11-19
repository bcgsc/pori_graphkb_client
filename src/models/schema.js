
/**
 * Knowledgebase schema.
 */
class Schema {
  constructor(schema) {
    this.schema = schema;
  }

  /**
   * Returns Knowledgebase class schema.
   * @param {string} className - class name;
   */
  get(className) {
    return this.schema[className];
  }

  getPreview(obj) {
    if (!obj['@class'] || !this.schema[obj['@class']]) return null;
    return this.schema[obj['@class']].getPreview(obj);
  }

  /**
   * Returns route and properties of a certain knowledgebase class
   * (most useful data).
   * @param {string} className - requested class name.
   * @param {Array<string>} extraProps - Extra props to be returned in the
   * class properties list.
   */
  getProperties(className, extraProps = []) {
    const { schema } = this;
    const VPropKeys = schema.V.properties;
    const classModel = schema[className];
    if (!classModel) return null;
    return Object.keys(classModel.properties || [])
      .filter(prop => !VPropKeys[prop] || extraProps.includes(prop))
      .map(prop => classModel.properties[prop]);
  }

  getRoute(className) {
    return this.schema[className].routeName;
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
      && (this.getProperties(kbClass, extraProps) || {});
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
    const list = schema.Ontology.subclasses.slice();
    if (!subOnly) list.push(schema.Ontology);
    return list;
  }

  /**
   * Returns all variant types.
   * @param {boolean} subOnly - flag for checking only subclasses.
   */
  getVariants(subOnly) {
    const { schema } = this;
    const list = schema.Variant.subclasses.slice();
    if (!subOnly) list.push(schema.Variant);
    return list;
  }

  /**
   * Returns a list of strings containing all valid edge class names.
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
   * Updates allColumns list with any new properties from ontologyTerm.
   * @param {Object} term - new node who's properties will be parsed.
   * @param {Array} allColumns - current list of all collected properties.
   */
  collectOntologyProps(term, allColumns) {
    const properties = this.getProperties(term['@class']);
    properties.forEach((prop) => {
      if (!allColumns.includes(prop.name)) {
        if (term[prop.name]) {
          if (prop.type === 'link' || prop.type === 'embedded') {
            const nestedProperties = this.getProperties(term[prop.name]['@class']);
            if (prop.linkedClass && prop.linkedClass.isAbstract) {
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
}

export default Schema;
