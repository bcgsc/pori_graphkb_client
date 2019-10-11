import { boundMethod } from 'autobind-decorator';

import kbSchema from '@bcgsc/knowledgebase-schema';

import api from './api';

const { schema: SCHEMA_DEFN } = kbSchema;

const MAX_LABEL_LENGTH = 50;


/**
 * Knowledgebase schema.
 */
class Schema {
  constructor(schema = SCHEMA_DEFN) {
    this.schema = schema.schema;
    this.has = schema.has.bind(schema);
    this.get = schema.get.bind(schema);
    this.getFromRoute = schema.getFromRoute.bind(schema);
  }

  @boundMethod
  getModel(name) {
    try {
      return this.get(name);
    } catch (err) {
      const model = this.getFromRoute(name);

      if (model) {
        return model;
      }
      throw err;
    }
  }

  /**
   * Get a string representation of a record
   */
  @boundMethod
  getLabel(obj, truncate = true) {
    let label;

    if (obj) {
      if (obj.displayNameTemplate) {
        label = this.getPreview(obj);

        if (label.length > MAX_LABEL_LENGTH - 3 && truncate) {
          label = `${label.slice(0, MAX_LABEL_LENGTH - 3)}...`;
        }
        return label;
      } if (obj.displayName || obj.name) {
        label = obj.displayName || obj.name;

        if (obj['@rid']) {
          label = `${label} (${obj['@rid']})`;
        }
        return label;
      }
      if (obj.target) {
        return this.getLabel(obj.target);
      }
      if (obj['@class']) {
        return obj['@class'];
      }
    }
    return obj;
  }

  @boundMethod
  getLink(obj) {
    if (obj && obj['@rid']) {
      const { name } = this.get(obj) || this.get('V');
      return `/view/${name}/${obj['@rid'].slice(1)}`;
    }
    return '';
  }

  /**
   * Returns preview of given object based on its '@class' value
   * @param {Object} obj - Record to be parsed.
   */
  @boundMethod
  getPreview(obj) {
    if (obj) {
      if (obj.displayNameTemplate) {
        const statementBuilder = (record) => {
          if (record === undefined) {
            return null;
          }
          const vals = Array.isArray(record) ? record : [record];
          let label = '';
          vals.forEach((val) => {
            if (val) {
              label = `${label}${val.displayName} `;
            }
          });
          return label;
        };

        const implyBy = statementBuilder(obj.conditions);
        const relevance = statementBuilder(obj.relevance);
        const subject = statementBuilder(obj.subject);
        const evidence = statementBuilder(obj.evidence);

        const label = obj.displayNameTemplate
          .replace('{conditions}', implyBy)
          .replace('{relevance}', relevance)
          .replace('{subject}', subject)
          .replace('{evidence}', evidence);

        return label;
      }

      if (obj.displayName || obj.name) {
        let label;
        label = obj.displayName || obj.name;

        if (label.length > MAX_LABEL_LENGTH) {
          label = `${label.slice(0, MAX_LABEL_LENGTH - 3)}...`;
        }
        if (obj['@rid']) {
          label = `${label} (${obj['@rid']})`;
        }
        return label;
      }
      if (obj['@class']) {
        const label = this.getPreview(this.get(obj));

        if (label) {
          return label;
        }
      }
      if (obj['@rid']) {
        return obj['@rid'];
      }
      if (Array.isArray(obj)) { // embedded link set
        return obj.length;
      }
    }
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
   * Validates a value against some property model and returns the new property tracking object
   */
  @boundMethod
  validateValue(propModel, value, ignoreMandatory = false) {
    if (value === undefined || value === '' || (typeof value === 'object' && value && Object.keys(value).length === 0)) {
      if (propModel.mandatory
      && !ignoreMandatory
      && !propModel.generated
      && propModel.default === undefined
      && !propModel.generateDefault
      ) {
        return { error: { message: 'Required Value' }, value };
      }
    } else if (value === null && !propModel.nullable) {
      return { error: { message: 'Cannot be empty/null' }, value };
    } else if (value !== null) { // validate the new value using the schema model property
      if (propModel.linkedClass && propModel.type.includes('embedded')) {
        const subErrors = {};
        let embeddedModel;

        try {
          embeddedModel = this.get(value);
        } catch (err) { } // eslint-disable-line no-empty

        if (!embeddedModel) {
          return { error: { '@class': { message: 'Required Value' } } };
        }
        Object.values(embeddedModel.properties).forEach((subPropModel) => {
          const { name } = subPropModel;
          const { error } = this.validateValue(subPropModel, value[name], ignoreMandatory);

          if (error) {
            subErrors[name] = error;
          }
        });

        if (Object.keys(subErrors).length) {
          return { error: subErrors, value };
        }
        return { value };
      }

      try {
        let valueToValidate = value;

        if (propModel.type === 'link') {
          valueToValidate = value['@rid'] || value;
        }
        propModel.validate(valueToValidate);
        return { value };
      } catch (err) {
        return { error: err, value };
      }
    }
    return { value };
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

    const showEdges = [];
    const showByDefault = [
      '@rid', '@class',
    ];

    const allProps = this.get(modelName).queryProperties;

    if (modelName.toLowerCase().includes('variant')) {
      showByDefault.push('reference1', 'reference2', 'type');
    } else if (modelName.toLowerCase() === 'statement') {
      showByDefault.push('source', 'subject', 'relevance', 'evidenceLevel');
    } else if (modelName.toLowerCase() !== 'source') {
      showByDefault.push('sourceIdVersion', 'version', 'source', 'name', 'sourceId');
      showEdges.push('out_SubClassOf');
    } else {
      showByDefault.push('version', 'name', 'usage');
    }

    const defineLinkSetColumn = (name) => {
      const colId = name;
      const getLinkData = ({ data }) => data && (data[name] || []);

      return {
        colId,
        field: colId,
        sortable: false,
        valueGetter: getLinkData,
        width: 300,
        cellRenderer: 'RecordList',
      };
    };

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
      'displayName',
      'displayNameTemplate',
    ];

    const showNested = [
      '@rid',
      '@class',
      'displayName',
    ];

    const getPreview = propName => ({ data }) => {
      if (data && data[propName]) {
        return this.getLabel(data[propName], false);
      }
      return '';
    };

    const valueGetter = (propName, subPropName = null) => ({ data }) => {
      if (data) {
        if (!subPropName) {
          return this.getLabel(data[propName]);
        } if (data[propName]) {
          return this.getLabel(data[propName][subPropName]);
        }
      }
      return '';
    };

    const defns = [
      {
        colId: 'preview',
        field: 'preview',
        sortable: false,
        valueGetter: ({ data }) => this.getLabel(data),
      },
    ];

    Object.values(allProps)
      .filter(prop => !exclude.includes(prop.name) && prop.type !== 'embedded')
      .sort((p1, p2) => p1.name.localeCompare(p2.name))
      .forEach((prop) => {
        const hide = !showByDefault.includes(prop.name);

        if (prop.type === 'linkset') {
          defns.push(defineLinkSetColumn(prop.name));
        } else if (prop.linkedClass) {
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
          Object.values(prop.linkedClass.queryProperties).forEach((subProp) => {
            if (showNested.includes(subProp.name)) {
              const colDef = ({
                field: subProp.name,
                colId: `${prop.name}.${subProp.name}`,
                valueGetter: valueGetter(prop.name, subProp.name),
                columnGroupShow: 'open',
                sortable: true,
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
