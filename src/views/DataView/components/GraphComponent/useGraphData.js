import {
  useCallback,
  useReducer,
} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';


const graphDataReducer = (state, action) => {
  const { type: actionType, payload } = action;

  if (actionType === 'update') {
    const updatedData = {};
    Object.keys(payload).forEach((key) => {
      updatedData[key] = payload[key];
    });

    return { ...state, ...updatedData };
  }
  if (actionType === 'replace') {
    return { ...payload };
  }
  throw new Error(`actionType (${actionType} not implmented)`);
};

/**
 * Hook for a component that depends on an object parameter
 *
 * @param {Object} initialValue the start object
 */
const useGraphData = (initialValue = {}) => {
  const [graphValues, setGraphValues] = useReducer(graphDataReducer, initialValue);

  const replace = useCallback((newContent = {}) => {
    setGraphValues({ type: 'replace', payload: newContent });
  }, []);

  const update = useCallback((newContent = {}) => {
    setGraphValues({ type: 'update', payload: newContent });
  }, [setGraphValues]);

  useDeepCompareEffect(() => {
    replace(initialValue);
  }, [initialValue]);

  return { graphValues, update, replace };
};

export default useGraphData;
