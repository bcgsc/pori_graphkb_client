import kbSchema, { Property } from '@bcgsc-pori/graphkb-schema';
import { boundMethod } from 'autobind-decorator';
import { titleCase } from 'change-case';

import { getQueryFromSearch } from './api/search';

const { schema: SCHEMA_DEFN } = kbSchema;

const MAX_LABEL_LENGTH = 50;

/**
 * Knowledgebase schema.
 */
class Schema {
  constructor(schema = SCHEMA_DEFN) {
    this.schemaDefn = SCHEMA_DEFN;
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
    let label = this.getPreview(obj);

    if (label && obj['@rid'] && !label.includes(obj['@rid'])) {
      label = `${label} (${obj['@rid']})`;
    }

    if (label) {
      if (label.length > MAX_LABEL_LENGTH - 3 && truncate) {
        label = `${label.slice(0, MAX_LABEL_LENGTH - 3)}...`;
      }
      return label;
    }
    return obj;
  }

  @boundMethod
  getLink(obj) {
    if (obj && obj['@rid']) {
      const { name } = this.get(obj) || this.get('V');
      return `/view/${name}/${obj['@rid'].replace(/^#/, '')}`;
    }
    return '';
  }

  /**
   * Returns preview of given object based on its '@class' value
   * @param {Object} obj - Record to be parsed.
   */
  getPreview(obj) {
    return this.schemaDefn.getPreview(obj);
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

  isEdge(cls) {
    return this.isSubclass(cls, 'E');
  }

  /**
   * Validates a value against some property model and returns the new property tracking object
   */
  @boundMethod
  validateValue(propModel, value, { ignoreMandatory = false }) {
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
        let subErrors = {};
        let embeddedModel;

        const valErrorCheck = (subPropModel, val, errors) => {
          const { name } = subPropModel;
          const { error } = this.validateValue(subPropModel, val[name], { ignoreMandatory });

          const newErrors = { ...errors };

          if (error) {
            newErrors[name] = error;
          }

          return newErrors;
        };

        if (Array.isArray(value) && value.length) {
          // values could have different class models
          value.forEach((val) => {
            embeddedModel = this.get(val);

            if (embeddedModel) {
              Object.values(embeddedModel.properties).forEach((subPropModel) => {
                subErrors = valErrorCheck(subPropModel, val, subErrors);
              });
            }
          });
        } else {
          try {
            embeddedModel = this.get(value);
          } catch (err) { } // eslint-disable-line no-empty

          if (!embeddedModel) {
            return { error: { '@class': { message: 'Required Value' } } };
          }

          Object.values(embeddedModel.properties).forEach((subPropModel) => {
            subErrors = valErrorCheck(subPropModel, value, subErrors);
          });
        }

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
        Property.validateWith(propModel, valueToValidate);
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
    const { modelName } = getQueryFromSearch({ schema: this, search });

    const showEdges = [];
    const showByDefault = [];
    const defaultOrdering = [];

    const linkChipWidth = 300;

    const allProps = this.get(modelName).queryProperties;

    if (modelName.toLowerCase().includes('variant')) {
      showByDefault.push('reference1', 'reference2', 'type');
    } else if (modelName.toLowerCase() === 'statement') {
      defaultOrdering.push(...['relevance', 'subject', 'conditions', 'source', 'evidenceLevel', 'evidence']);
      showByDefault.push('source', 'subject', 'relevance', 'evidenceLevel');
    } else if (modelName.toLowerCase() !== 'source') {
      showByDefault.push('sourceIdVersion', 'version', 'source', 'name', 'sourceId');
      showEdges.push('out_SubClassOf');
    } else {
      showByDefault.push('version', 'name', 'usage');
    }

    const defineLinkSetColumn = (name) => {
      const colId = name;
      const getLinkData = ({ data }) => data && (data[name] || []).map(l => this.getPreview(l));

      return {
        colId,
        field: colId,
        headerName: titleCase(colId),
        sortable: false,
        valueGetter: getLinkData,
        width: linkChipWidth,
      };
    };

    const getCondition = propName => ({ data }) => {
      let values;

      if (data && data.conditions && propName !== 'other') {
        values = data.conditions.filter(val => (val['@class'].toLowerCase().includes(propName)));
      } else if (data && data.conditions) {
        values = data.conditions.filter(val => (
          !val['@class'].toLowerCase().includes('variant')
          && !val['@class'].toLowerCase().includes('disease')
          && (!data.subject || (data.subject['@rid'] !== val['@rid']))
        ));
      }
      if (values) {
        return values.map(v => this.getPreview(v));
      }
      return values;
    };

    const defineConditionsColumn = () => {
      const conditionsDefn = {
        headerName: 'Conditions',
        groupId: 'Conditions',
        openByDefault: true,
        children: [],
      };

      ['variant', 'disease', 'other'].forEach((cls) => {
        const colDef = {
          field: cls,
          colId: cls,
          headerName: titleCase(cls),
          valueGetter: getCondition(cls),
          sortable: false,
          width: cls === 'other' ? 150 : linkChipWidth,
        };

        conditionsDefn.children.push(colDef);
      });
      return conditionsDefn;
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

      const getEdgeData = ({ data }) => data && (data[name] || []).map(edge => this.getPreview(edge[target]));

      return {
        colId,
        field: colId,
        headerName: titleCase(colId),
        sortable: false,
        valueGetter: getEdgeData,
        width: linkChipWidth,
      };
    };

    const compareColumnsForSort = (col1, col2) => {
      const index1 = defaultOrdering.indexOf(col1.name);
      const index2 = defaultOrdering.indexOf(col2.name);

      if (index1 === index2) {
        return col1.name.localeCompare(col2.name);
      } if (index1 === -1) {
        return 1;
      } if (index2 === -1) {
        return -1;
      }
      return index1 - index2;
    };

    const exclude = [
      'deletedBy',
      'deletedAt',
      'groupRestrictions',
      'history',
      'groups',
      'uuid',
      'displayName',
    ];

    const showNested = [
      '@rid',
      '@class',
      'displayName',
    ];

    const valueGetter = (propName, subPropName = null) => ({ data }) => {
      if (data) {
        if (!subPropName) {
          return this.getPreview(data[propName]);
        } if (data[propName]) {
          return this.getPreview(data[propName][subPropName]);
        }
      }
      return '';
    };

    const defns = [];

    defns.push({
      colId: 'preview',
      field: 'preview',
      sortable: false,
      valueGetter: ({ data }) => this.getPreview(data, false),
      hide: modelName === 'Statement',
    });

    const propModels = Object.values(allProps)
      .filter(prop => !exclude.includes(prop.name) && prop.type !== 'embedded')
      .sort(compareColumnsForSort);

    const skinnyLinks = ['evidenceLevel', 'source']; // generally short content

    propModels.forEach((prop) => {
      const hide = !showByDefault.includes(prop.name);

      if (prop.name === 'conditions') {
        defns.push(defineConditionsColumn());
      } else if (prop.type === 'linkset') {
        defns.push(defineLinkSetColumn(prop.name));
      } else if (prop.type === 'link' || prop.linkedClass) {
        // build a column group
        const groupDefn = {
          headerName: titleCase(prop.name),
          groupId: prop.name,
          openByDefault: false,
          children: [{
            field: 'displayName',
            colId: `${prop.name}.displayName`,
            headerName: titleCase('displayName'),
            valueGetter: valueGetter(prop.name, 'displayName'),
            columnGroupShow: '',
            sortable: true,
            width: skinnyLinks.includes(prop.name)
              ? 150
              : 250,
            hide,
          }],
        };
        Object.values((prop.linkedClass || this.schema.V).queryProperties).forEach((subProp) => {
          if (showNested.includes(subProp.name) && subProp.name !== 'displayName') {
            const colDef = ({
              field: subProp.name,
              colId: `${prop.name}.${subProp.name}`,
              headerName: titleCase(subProp.name),
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
          headerName: titleCase(prop.name),
          hide,
          colId: prop.name,
        });
      }
    });

    showEdges.forEach((edgeName) => {
      defns.push(defineEdgeColumn(edgeName));
    });

    return defns;
  }
}

const schema = new Schema(SCHEMA_DEFN);

export default schema;
