import { useCallback, useReducer } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';

type Action<T> = | { type: 'update', payload: { name: keyof T, value: unknown } }
| { type: 'bulk-update', payload: Partial<T> }
| { type: 'replace', payload: T };

function useObject<T extends object>(initialValue: T): {
  content: T;
  updateField: (name: keyof T, value: unknown) => void,
  replace: (newContent: T) => void,
  update: (newContent: Partial<T>) => void,
  removeField: (name: keyof T) => void
} {
  const [content, setContent] = useReducer(
    (state: T, action: Action<T>): T => {
      const { type: actionType, payload } = action;

      if (actionType === 'update') {
        const { name, value } = payload;
        return {
          ...state,
          [name]: value,
        };
      }

      if (actionType === 'bulk-update') {
        return { ...state, ...payload };
      }

      if (actionType === 'replace') {
        return { ...payload };
      }

      throw new Error(`actionType (${actionType}) is not implemented`);
    },
    initialValue,
  );

  const updateField = useCallback((name: keyof T, value: any) => {
    setContent({ type: 'update', payload: { name, value } });
  }, [setContent]);

  const update = useCallback((newContent: Partial<T> = {} as T) => {
    setContent({ type: 'bulk-update', payload: newContent });
  }, [setContent]);

  const replace = useCallback((newContent: T = {} as T) => {
    setContent({ type: 'replace', payload: newContent });
  }, [setContent]);

  const removeField = useCallback((name: keyof T) => {
    const { [name]: removed, ...rest } = content;
    setContent({ type: 'replace', payload: rest as T });
  }, [content, setContent]);

  useDeepCompareEffect(() => {
    replace(initialValue || {});
  }, [initialValue || {}]);

  return {
    content,
    updateField,
    replace,
    update,
    removeField,
  };
}

export default useObject;
