import { setProjectAnnotations } from '@storybook/react-vite';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { plugins } from '@vitest/pretty-format'; // dependency of vitest
import { format } from 'date-fns';
import { afterEach, expect, beforeAll } from 'vitest';

import * as previewAnnotations from '#.storybook/preview';
process.env.REACT_APP_VERSION = '1.0.0'

const today = format(new Date(), 'yyyy-MM-dd');

/**
 * used to normalize snapshots
 *
 * using snapshots for styles is too finicky to maintain
 * and should swap to image snapshots if want that level
 * of surity.
 * currently just used as a safeguard that the content is there
 * for cases where it would be much too combersome to avoid having to write asserts
 * for every piece of content that should or should be be on the page
 *
 * for that reason this helper will replace any generated classnames, ids, uuids,
 * relative dates, current dates etc. and omit style attributes entirely
 */
function replaceNonDeterministicValues(value) {
  let fixed = value;
  // uuids
  fixed = fixed.replace(/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/g, ':uuid:');
  // react useId
  fixed = fixed.replace(/"\_r\_[0-9a-z]+_/g, '"_r_XXXX_')

  // aria-live description from ag-grid that doesn't always update the same
  fixed = fixed.replace(/<div[^>]*aria-relevant="additions text"[^>\/]*(>[^/]*<\/div>|\/>)/g, '');
  // other generated ag-grid ids
  fixed = fixed.replace(/id="cell-[^-"]+-[^-"]+"/g, (matched) => matched.replaceAll(/\d+/g, 'XXXX'));
  fixed = fixed.replace(/id="ag-\d+/g, 'id="ag-XXXX');

  const flakyAgGridClasses = ['ag-row-not-inline-editing','ag-body-horizontal-content-no-gap', 'ag-scrollbar-scrolling', 'ag-invisible']

  fixed = fixed.replaceAll(/class="([^"]+)"/g, (_, classnames) => {
    const classes = Array.from(new Set(classnames.trim().split(' '))).map((name) => name.replace(/css\-[0-9a-zA-Z]+/g, 'css-XXXX')).filter((name) => !flakyAgGridClasses.includes(name)).sort().join(' ');
    return `class="${classes}"`;
  });

  fixed = fixed.replaceAll(/[ ]*style="([^"]+)"\n?/g, '');

  fixed = fixed.replaceAll(new RegExp(`"${today}"`, 'g'), '":today:"');
  fixed = fixed.replace(/\d+ [a-z]+ ago/g, 'XXXX XXXX ago');

  // remove html comments
  fixed = fixed.replace(/<!--[ a-zA-Z0-9_-]+-->/g, '');
  // remove extra newlines
  fixed = fixed.replace(/[ \n]*\n+/g, '\n');

  return fixed;
}

expect.extend(matchers);
expect.addSnapshotSerializer({
  serialize: (...args) => replaceNonDeterministicValues(plugins.DOMElement.serialize(...args)),
  test: plugins.DOMElement.test,
});
expect.addSnapshotSerializer({
  serialize: (...args) => replaceNonDeterministicValues(plugins.DOMCollection.serialize(...args)),
  test: plugins.DOMCollection.test,
});
// omit <style> nodes
expect.addSnapshotSerializer({
  serialize: () => '',
  test: (val) => plugins.DOMElement.test(val) && val?.tagName === 'STYLE',
});

const annotations = setProjectAnnotations([previewAnnotations]);

beforeAll(annotations.beforeAll);

afterEach(() => {
  cleanup(); // from @testing-library/react
});

window._env_ = {
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || "GraphKB",
  KEYCLOAK_ROLE: process.env.KEYCLOAK_ROLE || "GraphKB",
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || "GSC",
  KEYCLOAK_URL: process.env.KEYCLOAK_URL || "https://keycloakdev.bcgsc.ca/auth",
  API_BASE_URL: process.env.API_BASE_URL || "https://graphkbdev-api.bcgsc.ca",
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || "graphkb@bcgsc.ca",
  CONTACT_TICKET_URL: process.env.CONTACT_TICKET_URL || "https://www.bcgsc.ca/jira/projects/KBDEV",
};
