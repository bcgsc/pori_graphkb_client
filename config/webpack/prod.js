const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/production');


module.exports = createBaseConfig({
  outputPath: DIST,
  mode: 'production',
  env: {
    API_BASE_URL: 'https://graphkb-api.bcgsc.ca',
    KEYCLOAK_URL: 'https://sso.bcgsc.ca/auth',
    NODE_ENV: 'production',
  },
  sourceMap: false,
});
