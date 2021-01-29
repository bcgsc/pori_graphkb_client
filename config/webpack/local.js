const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/production');

module.exports = createBaseConfig({
  outputPath: DIST,
  env: {
    API_BASE_URL: `http://${process.env.HOSTNAME}:8080`,
    KEYCLOAK_URL: 'https://keycloakdev.bcgsc.ca/auth',
    KEYCLOAK_REALM: 'GSC',
    NODE_ENV: 'local',
  },
  sourceMap: true,
  mode: 'development',
});
