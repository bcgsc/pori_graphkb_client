const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/production');


module.exports = createBaseConfig({
  outputPath: DIST,
  mode: 'production',
  define: {
    'window._env_': JSON.stringify({
      API_BASE_URL: 'https://graphkb-api.bcgsc.ca',
      KEYCLOAK_URL: 'https://sso.bcgsc.ca/auth',
      KEYCLOAK_REALM: 'GSC',
    }),
  },
  sourceMap: false,
});
