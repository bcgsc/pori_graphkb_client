import {
  useReducer, useCallback,
} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';


/**
 * Hook for a component that depends on an object parameter
 *
 * @param {Object} initialValue the start object
 */
const useObject = (initialValue = {}) => {
  const [content, setContent] = useReducer((state, action) => {
    const { type: actionType, payload } = action;

    if (actionType === 'update') {
      const { name, value } = payload;
      return { ...state, [name]: value };
    } if (actionType === 'replace') {
      return { ...payload };
    }
    throw new Error(`actionType (${actionType}) not implemented`);
  }, initialValue || {});

  const updateField = useCallback((name, value) => {
    setContent({ type: 'update', payload: { name, value } });
  }, [setContent]);


  const replace = useCallback((newContent = {}) => {
    setContent({ type: 'replace', payload: newContent });
  }, [setContent]);


  useDeepCompareEffect(() => {
    replace(initialValue || {});
  }, [initialValue || {}]);

  return { content, updateField, replace };
};


export default useObject;
