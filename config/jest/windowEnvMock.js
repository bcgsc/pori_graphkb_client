import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as previewAnnotations from '../../.storybook/preview';

const annotations = setProjectAnnotations([previewAnnotations]);

// Run Storybook's beforeAll hook
beforeAll(annotations.beforeAll);

// necessary for extend-expect to work until upgrade to v6
window.expect = expect;

// Automatically clean up the DOM after each test run
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

