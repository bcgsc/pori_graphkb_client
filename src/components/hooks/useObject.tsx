import {
  useCallback,
  useReducer,
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
    }

    if (actionType === 'bulk-update') {
      return { ...state, ...payload };
    }

    if (actionType === 'replace') {
      return { ...payload };
    }
    throw new Error(`actionType (${actionType}) not implemented`);
  }, initialValue || {});

  const updateField = useCallback((name, value) => {
    setContent({ type: 'update', payload: { name, value } });
  }, [setContent]);

  const update = useCallback((newContent = {}) => {
    setContent({ type: 'bulk-update', payload: newContent });
  }, [setContent]);

  const replace = useCallback((newContent = {}) => {
    setContent({ type: 'replace', payload: newContent });
  }, [setContent]);

  const removeField = useCallback((name) => {
    const { [name]: removed, ...rest } = content;
    setContent({ type: 'replace', payload: rest });
  }, [content]);

  useDeepCompareEffect(() => {
    replace(initialValue || {});
  }, [initialValue || {}]);

  return {
    content, updateField, replace, update, removeField,
  };
};

export default useObject;
