import { boundMethod } from 'autobind-decorator';

import kbSchema from '@bcgsc/knowledgebase-schema';

import api from './api';

const { schema: SCHEMA_DEFN } = kbSchema;

const MAX_LABEL_LENGTH = 30;


/**
 * Knowledgebase schema.
 */
class Schema {
  constructor(schema = SCHEMA_DEFN) {
    this.schema = schema;
    this.normalizedModelNames = {};
    Object.values(schema).forEach((model) => {
      this.normalizedModelNames[model.name.toLowerCase()] = model;
      this.normalizedModelNames[model.routeName] = model;
      this.normalizedModelNames[model.routeName.slice(1)] = model;
    });
  }

  /**
   * Check that a given class/model name exists
   */
  has(obj) {
    try {
      return Boolean(this.get(obj));
    } catch (err) {
      return false;
    }
  }

  /**
   * Returns Knowledgebase class schema.
   * @param {Object|string} obj - Record to fetch schema of.
   */
  @boundMethod
  get(obj) {
    let cls = obj;
    if (obj && typeof obj === 'object' && obj['@class']) {
      cls = obj['@class'];
    }
    return this.normalizedModelNames[typeof cls === 'string'
      ? cls.toLowerCase()
      : cls
    ];
  }

  getFromRoute(routeName) {
    for (const model of Object.values(this.schema)) {  // eslint-disable-line
      if (model.routeName === routeName) {
        return model;
      }
    }
    throw new Error(`Missing model corresponding to route (${routeName})`);
  }

  /**
   * Get a string representation of a record
   */
  @boundMethod
  getLabel(obj, truncate = true) {
    try {
      let label = this.get(obj).getPreview(obj);
      if (label.length > MAX_LABEL_LENGTH - 3 && truncate) {
        label = `${label.slice(0, MAX_LABEL_LENGTH - 3)}...`;
      }
      if (obj['@rid']) {
        label = `${label} (${obj['@rid']})`;
      }
      return label;
    } catch (err) {}  // eslint-disable-line
    try {
      return obj['@rid'];
    } catch (err) {} // eslint-disable-line
    return obj;
  }

  @boundMethod
  getLink(obj) {
    const { routeName } = this.get(obj) || this.get('V');
    return `/view${routeName}/${obj['@rid'].slice(1)}`;
  }

  /**
   * Returns preview of given object based on its '@class' value
   * @param {Object} obj - Record to be parsed.
   */
  @boundMethod
  getPreview(obj) {
    try {
      return this.get(obj).getPreview(obj);
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
    const classModel = this.get(obj);
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
   * Given some search string, defines column definitions for AgGrid table
   *
   * @param {string} search the URI search component
   *
   * @returns {Array.<object>} the column definitions to be applied to a grid
   */
  defineGridColumns(search) {
    const { modelName } = api.getQueryFromSearch({ schema: this, search });

    let allProps;
    const showEdges = [];

    const showByDefault = [
      '@rid', '@class',
    ];

    if (modelName && modelName.toLowerCase() !== 'statement') {
      allProps = this.get(modelName).queryProperties;
      if (modelName.toLowerCase().includes('variant')) {
        showEdges.push('in_ImpliedBy');
        showByDefault.push('reference1', 'reference2', 'type');
      } else if (modelName.toLowerCase() !== 'source') {
        showByDefault.push('sourceIdVersion', 'version', 'source', 'name', 'sourceId');
        showEdges.push('out_SubClassOf');
      } else {
        showByDefault.push('version', 'name', 'usage');
      }
    } else {
      showEdges.push('out_ImpliedBy', 'out_SupportedBy');
      allProps = this.get('Statement').queryProperties;
      showByDefault.push('source', 'appliesTo', 'relevance');
    }

    const defineEdgeColumn = (name) => {
      const type = name.startsWith('out')
        ? 'out'
        : 'in';
      const target = type === 'out'
        ? 'in'
        : 'out';
      let colId = name.slice(type.length + 1);
      if (type === 'in') {
        colId = this.get(colId).reverseName;
      }

      const getEdgeData = ({ data }) => data && (data[name] || []).map(edge => edge[target]);

      return {
        colId,
        field: colId,
        sortable: false,
        valueGetter: getEdgeData,
        width: 300,
        cellRenderer: 'RecordList',
      };
    };

    const exclude = [
      'deletedBy',
      'deletedAt',
      'groupRestrictions',
      'history',
      'groups',
      'uuid',
    ];

    const showNested = [
      '@rid',
      '@class',
      'source',
      'sourceId',
      'name',
    ];

    const getPreview = propName => ({ data }) => {
      if (data && data[propName]) {
        return this.getLabel(data[propName], false);
      }
      return null;
    };

    const valueGetter = (propName, subPropName = null) => ({ data }) => {
      if (data) {
        if (!subPropName) {
          return data[propName];
        } if (data[propName]) {
          return data[propName][subPropName];
        }
      }
      return null;
    };

    const defns = [
      {
        colId: 'preview',
        field: 'preview',
        sortable: false,
        valueGetter: ({ data }) => this.getLabel(data, false),
      },
    ];

    Object.values(allProps)
      .filter(prop => !exclude.includes(prop.name) && prop.type !== 'embedded')
      .sort((p1, p2) => p1.name.localeCompare(p2.name))
      .forEach((prop) => {
        const hide = !showByDefault.includes(prop.name);
        if (prop.linkedClass) {
          // build a column group
          const groupDefn = {
            headerName: prop.name,
            groupId: prop.name,
            openByDefault: false,
            children: [{
              field: 'preview',
              sortable: false,
              valueGetter: getPreview(prop.name),
              colId: `${prop.name}.preview`,
              columnGroupShow: 'closed',
              hide,
            }],
          };
          Object.values(prop.linkedClass.properties).forEach((subProp) => {
            if (showNested.includes(subProp.name)) {
              const colDef = ({
                field: subProp.name,
                colId: `${prop.name}.${subProp.name}`,
                valueGetter: valueGetter(prop.name, subProp.name),
                columnGroupShow: 'open',
                hide,
              });
              groupDefn.children.push(colDef);
            }
          });
          defns.push(groupDefn);
        } else {
          // individual column
          defns.push({
            field: prop.name,
            hide,
            colId: prop.name,
          });
        }
      });

    defns.sort((d1, d2) => (d1.colId || d1.groupId).localeCompare(d2.colId || d2.groupId));
    showEdges.forEach((edgeName) => {
      defns.push(defineEdgeColumn(edgeName));
    });

    return defns;
  }
}

export default Schema;
