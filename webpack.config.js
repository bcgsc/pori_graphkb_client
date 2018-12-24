const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // eslint ignore-line
const CleanWebpackPlugin = require('clean-webpack-plugin');


const buildPath = path.resolve(__dirname, 'src');
const distPath = path.resolve(__dirname, 'public');


const moduleSettings = {
  rules: [
    {
      test: /\.css$/,
      sideEffects: true,
      use: [
        // 'style-loader',
        MiniCssExtractPlugin.loader,
        'css-loader',
      ],
    },
    {
      test: /\.scss$/,
      sideEffects: true,
      use: [
        // 'style-loader',
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader',
      ],
    },
    {
      test: /\.js$/,
      include: [
        path.resolve(__dirname, 'node_modules/@bcgsc'),
        buildPath,
      ],
      use: ['babel-loader'],
    },
    {
      // convert images to embeded hashes
      test: /\.(bmp|gif|jpeg?|png)$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
    {
      // Load everything else
      test: /\.(md|svg)$/,
      loader: 'file-loader',
      options: {
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
  ],
};

module.exports = {
  context: buildPath,
  entry: [
    './../config/polyfills.js',
    './index.js',
  ],
  output: {
    path: distPath,
    filename: 'bundle.js',
  },
  devServer: {
    lazy: true,
    contentBase: distPath,
    filename: 'bundle.js',
  },
  plugins: [
    // separate the css from the main js bundle
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CleanWebpackPlugin(
      distPath,
      {
        exclude: ['index.html', 'favicon.ico', 'manifest.json'],
      },
    ),
    // Copy values of ENV variables in as strings using these defaults (null = unset)
    new webpack.EnvironmentPlugin({
      API_BASE_URL: 'http://kbapi01:8080/api',
      DEBUG: false,
      DISABLE_AUTH: null,
      KEYCLOAK_CLIENT_ID: 'GraphKB',
      KEYCLOAK_REALM: 'TestKB',
      KEYCLOAK_ROLE: 'GraphKB',
      KEYCLOAK_URL: 'http://ga4ghdev01.bcgsc.ca:8080/auth',
      NODE_ENV: 'production',
      USER: null,
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: moduleSettings,
};
