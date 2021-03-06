const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/production');

module.exports = createBaseConfig({
  outputPath: DIST,
  define: {
    'window._env_': JSON.stringify({
      API_BASE_URL: `http://${process.env.HOSTNAME}:8080`,
      KEYCLOAK_URL: 'https://keycloakdev.bcgsc.ca/auth',
      KEYCLOAK_REALM: 'GSC',
      KEYCLOAK_CLIENT_ID: 'GraphKB',
      KEYCLOAK_ROLE: 'GraphKB',
      CONTACT_EMAIL: 'graphkb@bcgsc.ca',
      CONTACT_TICKET_URL: 'https://www.bcgsc.ca/jira/projects/KBDEV',
      PUBLIC_PATH: '/',
      IS_DEMO: false,
    }),
    'process.env.NODE_ENV': JSON.stringify('local'),
  },
  sourceMap: true,
  mode: 'development',
});
