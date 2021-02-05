const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/development');


module.exports = createBaseConfig({
  outputPath: DIST,
  define: {
    'window._env_': JSON.stringify({
      API_BASE_URL: 'https://graphkbdev-api.bcgsc.ca',
      KEYCLOAK_URL: 'https://keycloakdev.bcgsc.ca/auth',
      KEYCLOAK_REALM: 'GSC',
    }),
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  sourceMap: true,
  mode: 'development',
});
