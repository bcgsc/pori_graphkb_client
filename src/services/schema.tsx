import { ClassDefinition, PropertyDefinition, schema as schemaDefn, validateProperty } from '@bcgsc-pori/graphkb-schema';
import { ColDef, ColGroupDef } from 'ag-grid-community';
import { titleCase } from 'change-case';

import { EdgeType, GeneralRecordType } from '@/components/types';

import { getQueryFromSearch } from './api/search';

const MAX_LABEL_LENGTH = 50;

/**
 * Get a string representation of a record
 *
 * @param obj record to get label of
 * @param options.truncate if true, label if cut off after 50 characters. defaults to true
 */
const getLabel = (obj, options?: { truncate: boolean; }) => {
  let label = schemaDefn.getPreview(obj);
  const truncate = options?.truncate ?? true;

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
};

const getLink = (obj) => {
  if (obj && obj['@rid']) {
    const { name } = schemaDefn.get(obj) || schemaDefn.get('V');
    return `/view/${name}/${obj['@rid'].replace(/^#/, '')}`;
  }
  return '';
};

/**
 * Returns record metadata fields
 */
const getMetadata = () => Object.values(schemaDefn.getProperties('V'));

/**
 * Returns route and properties of a certain knowledgebase class
 * (most useful data).
 * @param {Object|string} obj - Knowledgebase Record.
 * class properties list.
 */
const getProperties = (obj) => {
  const VPropKeys = schemaDefn.getProperties('V');
  const classModel: ClassDefinition = schemaDefn.get(obj);
  return Object.values(classModel?.properties ?? {})
    .filter((prop: PropertyDefinition) => !VPropKeys[prop.name]);
};

/**
 * Returns route and query properties of a certain knowledgebase class
 * (most useful data).
 * @param {string} className - requested class name.
 * class properties list.
 */
const getQueryProperties = (className) => {
  const VPropKeys = schemaDefn.getProperties('V');
  const classQueryableProperties = schemaDefn.queryableProperties(className);
  return Object.values(classQueryableProperties ?? {})
    .filter((prop) => !VPropKeys[prop.name]);
};

/**
 * Returns a list of strings containing all valid edge class names.
 */
function getEdges(): string[];

/**
 * Returns a list of edges extracted from the node based on the valid edge class names.
 * @param {Object} node - Object to retrieve edges from if input.
 */
function getEdges(node: null): string[];
function getEdges<ReqFields extends string = string>(node: GeneralRecordType<ReqFields> | null): EdgeType[];
function getEdges<ReqFields extends string = string>(node: GeneralRecordType<ReqFields> | null): string[];

function getEdges<ReqFields extends string = string>(node: GeneralRecordType<ReqFields> | null = null) {
  const list: string[] = schemaDefn.children('E');

  if (node) {
    const edges: EdgeType[] = [];
    Object.keys(node)
      .filter((key) => key.split('_')[1] && list.includes(key.split('_')[1]))
      .forEach((key) => edges.push(...node[key]));
    return edges;
  }

  return list;
}

const isEdge = (cls) => !!(schemaDefn.get(cls)
  && schemaDefn.children(cls).some((inherited) => inherited === 'E'));

/**
 * Validates a value against some property model and returns the new property tracking object
 */
const validateValue = (propModel, value, { ignoreMandatory = false }) => {
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
        const { error } = validateValue(subPropModel, val[name], { ignoreMandatory });

        const newErrors = { ...errors };

        if (error) {
          newErrors[name] = error;
        }

        return newErrors;
      };

      if (Array.isArray(value) && value.length) {
        // values could have different class models
        value.forEach((val) => {
          embeddedModel = schemaDefn.get(val);

          if (embeddedModel) {
            Object.values(embeddedModel.properties).forEach((subPropModel) => {
              subErrors = valErrorCheck(subPropModel, val, subErrors);
            });
          }
        });
      } else {
        try {
          embeddedModel = schemaDefn.get(value);
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
      // TODO not sure if this is equivalent
      //Property.validateWith(propModel, valueToValidate);
      validateProperty(propModel, valueToValidate);
      return { value };
    } catch (err) {
      return { error: err, value };
    }
  }
  return { value };
};

/**
 * Given some search string, defines column definitions for AgGrid table
 *
 * @param {string} search the URI search component
 *
 * @returns {Array.<object>} the column definitions to be applied to a grid
 */
const defineGridColumns = (search) => {
  const { modelName } = getQueryFromSearch(search);

  const showEdges: string[] = [];
  const showByDefault: string[] = [];
  const defaultOrdering: string[] = [];

  const linkChipWidth = 300;

  const allProps: Record<string, Property> = schemaDefn.queryableProperties(modelName);

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
    const getLinkData = ({ data }) => data && (data[name] || []).map((l) => schemaDefn.getPreview(l));

    return {
      colId,
      field: colId,
      headerName: titleCase(colId),
      sortable: false,
      valueGetter: getLinkData,
      width: linkChipWidth,
    };
  };

  const getCondition = (propName) => ({ data }) => {
    let values;

    if (data && data.conditions && propName !== 'other') {
      values = data.conditions.filter((val) => (val['@class'].toLowerCase().includes(propName)));
    } else if (data && data.conditions) {
      values = data.conditions.filter((val) => (
        !val['@class'].toLowerCase().includes('variant')
        && !val['@class'].toLowerCase().includes('disease')
        && (!data.subject || (data.subject['@rid'] !== val['@rid']))
      ));
    }
    if (values) {
      return values.map((v) => schemaDefn.getPreview(v));
    }
    return values;
  };

  const defineConditionsColumn = () => {
    const conditionsDefn: {
      headerName: string;
      groupId: string,
      openByDefault: boolean,
      children: ColDef[],
    } = {
      headerName: 'Conditions',
      groupId: 'Conditions',
      openByDefault: true,
      children: [],
    };

    ['variant', 'disease', 'other'].forEach((cls) => {
      const colDef: ColDef = {
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
      colId = schemaDefn.get(colId).reverseName;
    }

    const getEdgeData = ({ data }) => data && (data[name] || []).map((edge) => schemaDefn.getPreview(edge[target]));

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

  const valueGetter = (propName, subPropName: string | null = null) => ({ data }) => {
    if (data) {
      if (!subPropName) {
        return schemaDefn.getPreview(data[propName]);
      } if (data[propName]) {
        return schemaDefn.getPreview(data[propName][subPropName]);
      }
    }
    return '';
  };

  const defns: ColDef[] = [];

  defns.push({
    colId: 'preview',
    field: 'preview',
    sortable: false,
    valueGetter: ({ data }) => schemaDefn.getPreview(data, false),
    hide: modelName === 'Statement',
  });

  const propModels = Object.values(allProps)
    .filter((prop) => !exclude.includes(prop.name) && prop.type !== 'embedded')
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
      const groupDefn: ColGroupDef = {
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
      Object.values(schemaDefn.queryableProperties(prop.linkedClassName || 'V')).forEach((subProp: PropertyDefinition) => {
        if (showNested.includes(subProp.name) && subProp.name !== 'displayName') {
          const colDef: ColDef = ({
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
};

const schema = {
  defineGridColumns,
  validateValue,
  isEdge,
  getEdges,
  getProperties,
  getQueryProperties,
  getMetadata,
  getLabel,
  getLink,
};

export default schema;
