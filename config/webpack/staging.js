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
    }),
  },
  sourceMap: false,
});
