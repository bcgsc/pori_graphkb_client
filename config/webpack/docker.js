const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/production');

module.exports = createBaseConfig({
  outputPath: DIST,
  mode: 'production',
  sourceMap: false,
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
    KEYCLOAK_URL: process.env.KEYCLOAK_URL,
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM,
    NODE_ENV: 'production'
  },
});
