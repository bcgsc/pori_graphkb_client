import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import '../src/static/graphkb-env-config';

process.env.REACT_APP_VERSION = '1.0.0'

expect.extend(matchers);

const createStorage = () => {
  const store = new Map();

  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

if (!window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    value: createStorage(),
    configurable: true,
    writable: true,
  });
}

if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: window.localStorage,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  cleanup(); // from @testing-library/react
});
