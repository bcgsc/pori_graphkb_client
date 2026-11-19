import { useSnackbar } from 'notistack';
import { NavigateFunction } from 'react-router';

// eslint-disable-next-line @typescript-eslint/naming-convention
enum FORM_VARIANT {
  EDIT = 'edit', VIEW = 'view', DELETE = 'delete', NEW = 'new', SEARCH = 'search',
}

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

function encodeJSON(input: unknown): string {
  // Escape non-Latin-1 code units without changing the legacy base64 format.
  const json = JSON.stringify(input).replace(
    /[\u0100-\uffff]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
  return btoa(json);
}

function decodeJSON<R = unknown>(input: string): R {
  return JSON.parse(atob(input)) as R;
}

/**
 * Save graph state (nodeRIDS) to URL and jump to graphview with nodeRIDs as initial seed
 *
 * @param {Arrayof.<strings>} nodeRIDs an array of node RIDs
 * @param {object} navigate navigate of react-router-dom
 * @param {function} onErrorCallback callback function to call if error occurs
 */
const navigateToGraph = (nodeRIDs: unknown[], navigate: NavigateFunction, snackbar: ReturnType<typeof useSnackbar>) => {
  const search = new URLSearchParams();

  try {
    search.set('nodes', encodeJSON(nodeRIDs));
  } catch (err) {
    snackbar.enqueueSnackbar({ message: 'Unable to view graph. An error occurred encoding graph state', variant: 'error' });
  }

  navigate(`/data/graph?${search}`);
};

type MutableTupleValue<T> = T extends readonly unknown[]
  ? { -readonly [K in keyof T]: MutableTupleValue<T[K]> }
  : T extends object
    ? { -readonly [K in keyof T]: MutableTupleValue<T[K]> }
    : T;

/**
 * Preserves tuple argument literals without making nested objects or arrays readonly.
 */
function tuple<const T extends readonly [unknown, unknown, ...unknown[]]>(...values: T): MutableTupleValue<T> {
  return values as MutableTupleValue<T>;
}

export {
  cleanLinkedRecords,
  cleanPayload,
  decodeJSON,
  encodeJSON,
  FORM_VARIANT,
  navigateToGraph,
  tuple,
};
