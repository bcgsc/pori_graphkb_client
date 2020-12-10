const path = require('path');


const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/development');


module.exports = createBaseConfig({
  outputPath: DIST,
  env: {
    API_BASE_URL: 'https://graphkbdev-api.bcgsc.ca',
    KEYCLOAK_URL: 'https://keycloakdev.bcgsc.ca/auth',
    NODE_ENV: 'development',
  },
  sourceMap: true,
  mode: 'development',
});
