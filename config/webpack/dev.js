const merge = require('webpack-merge');
const webpack = require('webpack');
const TerserWebpackPlugin = require('terser-webpack-plugin');


const common = require('./common.js');


const devConfig = {
  mode: 'development',
  plugins: [
    // Copy values of ENV variables in as strings using these defaults (null = unset)
    new webpack.EnvironmentPlugin({
      API_BASE_URL: 'https://graphkbapidev.bcgsc.ca/api',
      DEBUG: false,
      DISABLE_AUTH: null,
      KEYCLOAK_CLIENT_ID: 'GraphKB',
      KEYCLOAK_REALM: 'GSC_posix_syncd',
      KEYCLOAK_ROLE: 'GraphKB',
      KEYCLOAK_URL: 'https://keycloakdev01.bcgsc.ca/auth',
      NODE_ENV: 'development',
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
