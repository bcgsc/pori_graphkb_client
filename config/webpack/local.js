const merge = require('webpack-merge');
const webpack = require('webpack');
const TerserWebpackPlugin = require('terser-webpack-plugin');


const common = require('./common.js');


const devConfig = {
  mode: 'development',
  plugins: [
    // Copy values of ENV variables in as strings using these defaults (null = unset)
    new webpack.EnvironmentPlugin({
      API_BASE_URL: `http://${process.env.HOSTNAME}:8080/api`,
      DEBUG: false,
      DISABLE_AUTH: null,
      KEYCLOAK_CLIENT_ID: 'GraphKB',
      KEYCLOAK_REALM: 'TestKB',
      KEYCLOAK_ROLE: 'GraphKB',
      KEYCLOAK_URL: 'https://keycloakdev.bcgsc.ca/auth',
      NODE_ENV: 'local',
      USER: null,
      PASSWORD: null,
      npm_package_version: null,
    }),
  ],
  optimization: {
    minimizer: [
      new TerserWebpackPlugin({
        terserOptions: {
          keep_classnames: true,
          module: true,
          sourceMap: true,
        },
      }),
    ],
  },
};
module.exports = merge(common, devConfig);
