import { useSnackbar } from 'notistack';
import * as qs from 'qs';
import { NavigateFunction } from 'react-router';

import { SchemaPropertyDefinition } from '@/services/schema';

const CLASS_MODEL_PROP = '@class';

// eslint-disable-next-line @typescript-eslint/naming-convention
enum FORM_VARIANT {
  EDIT = 'edit', VIEW = 'view', DELETE = 'delete', NEW = 'new', SEARCH = 'search',
}

/**
 * Given some model and options, sort the form fields and return the ordering. The 'fold'
 * described here is the collapsible block. Elements above the fold are in the top non-collapsed block
 * whereas fields below the fold are put into the collapsible section
 *
 * @returns {Object.<string,Array.<(string|Array.<string>)>>} the nested grouping structure
 *
 * @example
 * > sortAndGroupFields(schemaDefn.getProperties(model.name), {
 *    aboveFold: ['@class', '@rid', 'createdAt'],
 *    groups: [['createdBy', 'createdAt']]
 * })
 * {fields: ['@class', '@rid', ['createdBy', 'createdAt']], extraFields: []}
 */
const sortAndGroupFields = (
  /** the current class model to base the form off of */
  propertiesWithClass: Record<string, SchemaPropertyDefinition>,
  opt: {
    /** names of properties that should be promoted above the fold */
    aboveFold?: string[];
    /** flag to indicate if a collaspible section should be created */
    collapseExtra?: boolean;
    /** properties that should co-occur */
    groups?: string[][],
  } = {},
) => {
  if (!propertiesWithClass) {
    return { extraFields: [], fields: [] };
  }
  const { [CLASS_MODEL_PROP]: _, ...properties } = propertiesWithClass;
  type Group = {
    fields: string[];
    aboveFold: boolean;
    required: boolean;
  };
  const fieldsMap: Record<string, Group> = {};

  Object.values(properties).forEach((prop) => {
    const required = Boolean(
      prop.mandatory
      && prop.default === undefined
      && !prop.generated,
    );
    fieldsMap[prop.name] = {
      fields: [prop.name],
      required,
      aboveFold: required || opt.aboveFold?.includes(prop.name) || !opt.collapseExtra,
    };
  });

  opt.groups?.forEach((group) => {
    const filteredGroup = group.filter((key) => properties[key]);
    if (!filteredGroup.length) return;
    const first = filteredGroup[0];
    let { aboveFold, required } = fieldsMap[first];
    filteredGroup.slice(1).forEach((key) => {
      aboveFold ||= fieldsMap[key].aboveFold;
      required ||= fieldsMap[key].required;

      delete fieldsMap[key];
    });

    fieldsMap[first] = {
      fields: filteredGroup,
      required,
      aboveFold,
    };
  });

  const mainFields: (string | string[])[] = [];
  const extraFields: (string | string[])[] = [];

  Object.values(fieldsMap).sort((groupA, groupB) => {
    if (groupA.required === groupB.required) {
      return groupA.fields[0].localeCompare(groupB.fields[0]);
    }
    return groupA.required ? -1 : 1;
  }).forEach((group) => {
    const fields = group.fields.length === 1 ? group.fields[0] : group.fields;

    if (group.aboveFold) {
      mainFields.push(fields);
    } else {
      extraFields.push(fields);
    }
  });
  return { fields: mainFields, extraFields };
};

const cleanLinkedRecords = (content) => {
  const newContent = {};

  Object.keys(content).forEach((key) => {
    if (content[key] !== undefined) {
      if (Array.isArray(content[key])) {
        try {
          const ridArr = content[key].map((rec) => (rec['@rid']));

          if (content[key].length === 1) {
            newContent[key] = ridArr.join();
          } else {
            newContent[key] = ridArr;
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          if (content[key]['@rid']) {
            newContent[key] = content[key]['@rid'];
          } else {
            newContent[key] = content[key];
          }
        } catch (err) {
          newContent[key] = content[key];
        }
      }
    }
  });
  return newContent;
};

const cleanPayload = (payload) => {
  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }
  const newPayload = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && !/^(in|out)_\w+$/.exec(key)) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          newPayload[key] = value.map((arr) => {
            if (arr && arr['@rid']) {
              return arr['@rid'];
            }
            return cleanPayload(arr);
          });
        } else if (value['@rid']) {
          newPayload[key] = value['@rid'];
        } else {
          newPayload[key] = value;
        }
      } else {
        newPayload[key] = value;
      }
    }
  });
  return newPayload;
};

/**
 * Save graph state (nodeRIDS) to URL and jump to graphview with nodeRIDs as initial seed
 *
 * @param {Arrayof.<strings>} nodeRIDs an array of node RIDs
 * @param {object} navigate navigate of react-router-dom
 * @param {function} onErrorCallback callback function to call if error occurs
 */
const navigateToGraph = (nodeRIDs: unknown[], navigate: NavigateFunction, snackbar: ReturnType<typeof useSnackbar>) => {
  const savedState: { nodes?: string } = {};
  let encodedState;

  try {
    const stringifiedState = JSON.stringify(nodeRIDs);
    const base64encodedState = btoa(stringifiedState);
    const encodedContent = encodeURIComponent(base64encodedState);

    savedState.nodes = encodedContent;
    encodedState = qs.stringify(savedState);
  } catch (err) {
    snackbar.enqueueSnackbar({ message: 'Unable to view graph. An error occurred encoding graph state', variant: 'error' });
  }

  navigate({
    pathname: '/data/graph',
    search: `${encodedState}`,
  });
};

/**
 * parses through URL and decodes it to return an array of node RIDs.
 */
const getNodeRIDsFromURL = (href) => {
  const URLBeforeNodeEncoding = href.split('nodes')[0];
  const encodedData = href.split(URLBeforeNodeEncoding)[1];
  const { nodes } = qs.parse(encodedData.replace(/^\?/, ''));
  if (!nodes) return [];

  const decodedContent = decodeURIComponent(nodes);
  const base64decoded = atob(decodedContent);
  const decodedNodes = JSON.parse(base64decoded);
  return decodedNodes;
};

/**
 * wrapper to prevent issue with arrays such as [1, 's'] inferring their type as (string | number)[] instead of [number, string]
 * while this can be accomplished using `as const` for simple cases such as the example, if the array contains an object, then
 * using as const also makes that object and all its properties readonly
 */
function tuple<A1, A2, ARest>(a1: A1, a2: A2, ...rest: ARest[]): [A1, A2, ...ARest[]] {
  return [a1, a2, ...rest];
}

export {
  CLASS_MODEL_PROP,
  cleanLinkedRecords,
  cleanPayload,
  FORM_VARIANT,
  getNodeRIDsFromURL,
  navigateToGraph,
  sortAndGroupFields,
  tuple,
};
