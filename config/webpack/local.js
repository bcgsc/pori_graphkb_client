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
    }),
    'process.env.NODE_ENV': JSON.stringify('local'),
  },
  sourceMap: true,
  mode: 'development',
});
