import {
  ClassDefinition,
  PropertyDefinition, schema as schemaDefn,
  validateProperty,
} from '@bcgsc-pori/graphkb-schema';
import { ColDef, ColGroupDef } from 'ag-grid-community';
import { titleCase } from 'change-case';

import { EdgeType, GeneralRecordType } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';

import { getQueryFromSearch } from './api/search';

const MAX_LABEL_LENGTH = 50;

type SchemaPropertyDefinition = Partial<PropertyDefinition> & {
  name: string;
  label?: string;
  // missing from types
  generateDefault?: (record: Record<string, unknown>) => unknown;
  deprecated?: boolean;
  // pass input rendered by to FormField
  componentProps?: {
    multiline?: boolean;
    filterOptions?: string[];
    defaultFilterClassName?: string;
  }
  hide?: boolean;
};

type SchemaClassDefinition = Omit<ClassDefinition, 'properties'> & {
  properties: Record<string, SchemaPropertyDefinition>;
  /**
   * allow for mutating the properties based on the current state
   *
   * ex. use for conditionally required fields.
   */
  conditional?: (properties: Record<string, SchemaPropertyDefinition>, state: { content: Record<string, any>; variant: FORM_VARIANT }) => void;
};

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
 * Returns route and query properties of a certain knowledgebase class
 * (most useful data).
 * @param {string} className - requested class name.
 * class properties list.
 */
const getQueryProperties = (className) => {
  const VPropKeys = schemaDefn.getProperties('V');
  return Object.values(schemaDefn.queryableProperties(className) ?? {})
    .filter((prop: PropertyDefinition) => !VPropKeys[prop.name]);
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
function getEdges<R extends GeneralRecordType>(node: R): EdgeType[];
function getEdges<R extends GeneralRecordType>(node: R | null): string[] | EdgeType[];

function getEdges<R extends GeneralRecordType>(node: R | null = null) {
  const list: string[] = schemaDefn.children('E').slice();

  if (node) {
    const edges: EdgeType[] = [];
    Object.keys(node)
      .filter((key) => key.split('_')[1] && list.includes(key.split('_')[1]))
      .forEach((key) => {
        if (node[key].deletedAt === undefined || null) {
          edges.push(...node[key]);
        }
      });
    return edges;
  }

  return list;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
  properties?: Record<string, ValidationResult>;
  // if embeddedset or embeddedlist, separate result stored here
  items?: ValidationResult[];
}

function validateEmbedded(
  modelName: string,
  value: Record<string, any>,
) {
  let valid = true;
  const properties: Record<string, ValidationResult> = {};

  if (value['@class']) {
    if (value['@class'] !== modelName && !schemaDefn.inheritsFrom(value['@class'], modelName)) {
      return {
        valid: false,
        properties: { '@class': { message: `Value "${value['@class']}" is invalid. Embedded record must be a type that inherits from type ${modelName}`, valid: false } },
      };
    }
  }
  const model = schemaDefn.get(value['@class'] ?? modelName);
  Object.entries(model.properties).forEach(([propName, propModel]) => {
    properties[propName] = validateValue(propModel, value[propName]);
    valid &&= properties[propName].valid;
  });
  return { valid, properties };
}

function combineMessages(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  if (!a.endsWith('.')) {
    return `${a}. ${b}`;
  }
  return `${a} ${b}`;
}

/**
 * Validates a value against some property model and returns the new property tracking object
 */
const validateValue = (propModel: SchemaPropertyDefinition, value: unknown): ValidationResult => {
  let result: ValidationResult = { valid: true };

  if (value === undefined || value === '' || (typeof value === 'object' && value && Object.keys(value).length === 0)) {
    if (propModel.mandatory
      && !propModel.generated
      && propModel.default === undefined
      && !propModel.generateDefault
    ) {
      return { message: 'Required Value', valid: false };
    }
  } else if (value === null) {
    if (!propModel.nullable) {
      return { message: 'Cannot be empty/null', valid: false };
    }
  } else { // validate the new value using the schema model property
    if (propModel.type?.endsWith('set') || propModel.type?.endsWith('list')) {
      if (!Array.isArray(value)) {
        return { message: 'Value must be an array.', valid: false };
      }
    }

    try {
      let valueToValidate = value;

      if (propModel.type === 'link') {
        valueToValidate = value['@rid'] || value;
      }
      validateProperty(propModel as PropertyDefinition, valueToValidate);
    } catch (err) {
      result = { message: (err as Error).message || 'Field is invalid.', valid: false };
    }

    if (propModel.type?.includes('embedded') && propModel.linkedClass) {
      let embedded = [value];

      if (Array.isArray(value)) {
        embedded = value;
      }

      const embeddedResults: ValidationResult[] = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const embeddedValue of embedded) {
        if (typeof embeddedValue !== 'object') {
          embeddedResults.push({ message: 'Value is not an object.', valid: false });
        } else {
          embeddedResults.push(validateEmbedded(propModel.linkedClass || 'V', embeddedValue));
        }
      }

      result.valid &&= embeddedResults.every((r) => r.valid);

      if (propModel.type === 'embedded') {
        // not an array, just a single embed
        result.message = combineMessages(result.message, embeddedResults[0].message);
        result.properties = embeddedResults[0].properties;
      } else {
        result.items = embeddedResults;
      }
    }
  }
  return result;
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

  const allProps: Record<string, PropertyDefinition> = schemaDefn.queryableProperties(modelName);

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
    valueGetter: ({ data }) => schemaDefn.getPreview(data),
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
          sortable: true,
          width: skinnyLinks.includes(prop.name)
            ? 150
            : 250,
          hide,
        }],
      };
      Object.values(schemaDefn.queryableProperties(prop.linkedClass || 'V')).forEach((subProp: PropertyDefinition) => {
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

/**
 * return models with all properties (including inherited)
 * and adds any labels we want for anywhere we use that property
 *
 * preparing them all and generating once so that the models
 * are stable in render without having to wrap in useMemo
 */
function prepareModels() {
  const prepared: Record<string, SchemaClassDefinition> = {};
  schemaDefn.getModels().forEach((model) => {
    const preparedModel = {
      ...model,
      // schemaDefn.getProperties differs from model.properties in that it includes
      // all inherited properties
      properties: Object.fromEntries(Object.entries(schemaDefn.getProperties(model.name)).map(([name, prop]) => [name, { ...prop }])) as SchemaClassDefinition['properties'],
    };

    if (model.isEdge && model.name !== 'E') {
      preparedModel.properties.in = {
        ...preparedModel.properties.in,
        description: 'The target record for the relationship',
        label: 'Target Record (in)',
        linkedClass: model.targetModel || 'V',
      };
      preparedModel.properties.out = {
        ...preparedModel.properties.out,
        description: 'The source record for the relationship',
        label: 'Source Record (out)',
        linkedClass: model.sourceModel || 'V',
      };
    }

    if (schemaDefn.inheritsFrom(preparedModel.name, 'Variant')) {
      ['hgvsType', 'zygosity', 'germline'].forEach((propName) => {
        if (preparedModel.properties[propName]) {
          preparedModel.properties[propName].deprecated = true;
        }
      });
    }

    prepared[model.name] = preparedModel;
  });
  prepared.StatementReview.properties.comment.componentProps = {
    multiline: true,
  };
  prepared.PositionalVariant.properties.reference1.label = 'reference';
  prepared.PositionalVariant.properties.reference2.label = 'reference';
  // special case (KBDEV-790) to improve user inputs
  prepared.Statement.properties.conditions.componentProps = {
    filterOptions: [
      ...schemaDefn.descendants('Variant', { excludeAbstract: false, includeSelf: true }),
      'Disease',
      'CatalogueVariant',
    ],
    defaultFilterClassName: 'Variant',
  };
  prepared.PositionalVariant.properties.reference1.componentProps = {
    filterOptions: ['Signature', 'Feature'],
    defaultFilterClassName: 'Feature',
  };
  prepared.PositionalVariant.properties.break1Start.description = '';
  prepared.PositionalVariant.properties.break2Start.description = '';
  prepared.PositionalVariant.properties.break1End.description = 'end of the breakpoint range';
  prepared.PositionalVariant.properties.break2End.description = 'end of the breakpoint range';

  prepared.PositionalVariant.conditional = (draftProps, form) => {
    if (form.variant === FORM_VARIANT.VIEW) return;
    const variantTypeName = (form.content as any)?.type?.displayName;
    const isSubstitution = ['substitution', 'missense mutation', 'nonsense mutation'].includes(variantTypeName);
    draftProps.break2Start.mandatory = !isSubstitution;

    if (isSubstitution) {
      draftProps.reference2.hide = true;
      draftProps.break2Start.hide = true;
      draftProps.break2End.hide = true;
    }
    draftProps.refSeq.mandatory = isSubstitution;
    draftProps.untemplatedSeq.mandatory = isSubstitution;
    draftProps.reference2.mandatory = variantTypeName === 'fusion';
    draftProps.reference2.hide = variantTypeName !== 'fusion';
  };

  prepared.CategoryVariant.properties.reference1.componentProps = prepared.PositionalVariant.properties.reference1.componentProps;
  return prepared;
}

const models = prepareModels();

function getModel(valueOrName: unknown): SchemaClassDefinition;
function getModel(valueOrName: unknown, strict: false): SchemaClassDefinition | null;
function getModel(valueOrName: unknown, strict: true): SchemaClassDefinition;
function getModel(valueOrName: unknown, strict = true): SchemaClassDefinition | null {
  const name = schemaDefn.get(valueOrName, strict as true)?.name;
  return models[name];
}

const schema = {
  models,
  get: getModel,
  defineGridColumns,
  validateValue,
  getEdges,
  getQueryProperties,
  getMetadata,
  getLabel,
  getLink,
  has: schemaDefn.has.bind(schemaDefn),
  getPreview: schemaDefn.getPreview.bind(schemaDefn) as (value: unknown) => string,
  descendants: schemaDefn.descendants.bind(schemaDefn),
  ancestors: schemaDefn.ancestors.bind(schemaDefn),
  inheritsFrom: schemaDefn.inheritsFrom.bind(schemaDefn),
  queryableProperties: schemaDefn.queryableProperties.bind(schemaDefn),
  children: schemaDefn.children.bind(schemaDefn),
};

export type { SchemaClassDefinition, SchemaPropertyDefinition };

export default schema;
