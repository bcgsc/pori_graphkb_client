const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/production');


module.exports = createBaseConfig({
  outputPath: DIST,
  mode: 'production',
  env: {
    API_BASE_URL: 'https://graphkb-api.bcgsc.ca/api',
    KEYCLOAK_URL: 'https://keycloak.bcgsc.ca/auth',
    NODE_ENV: 'production',
  },
  sourceMap: false,
});
