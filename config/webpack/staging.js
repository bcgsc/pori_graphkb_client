const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/staging');

module.exports = createBaseConfig({
  outputPath: DIST,
  mode: 'production',
  define: {
    'window._env_': JSON.stringify({
      API_BASE_URL: 'https://graphkbstaging-api.bcgsc.ca',
      KEYCLOAK_URL: 'https://keycloakdev.bcgsc.ca/auth',
      KEYCLOAK_REALM: 'GSC',
      KEYCLOAK_CLIENT_ID: 'GraphKB',
      KEYCLOAK_ROLE: 'GraphKB',
      CONTACT_EMAIL: 'graphkb@bcgsc.ca',
      CONTACT_TICKET_URL: 'https://www.bcgsc.ca/jira/projects/KBDEV',
      PUBLIC_URL: '/',
    }),
  },
  sourceMap: false,
});
