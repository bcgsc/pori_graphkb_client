const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/staging');

module.exports = createBaseConfig({
  outputPath: DIST,
  mode: 'production',
  env: {
    API_BASE_URL: 'https://graphkbstaging-api.bcgsc.ca',
    KEYCLOAK_URL: 'https://keycloakdev.bcgsc.ca/auth',
    KEYCLOAK_REALM: 'GSC',
    NODE_ENV: 'production',
  },
  sourceMap: false,
});
