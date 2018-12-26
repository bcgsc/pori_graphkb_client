const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // eslint ignore-line
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


const SRC_PATH = path.resolve(__dirname, 'src');
const DIST_PATH = path.resolve(__dirname, 'dist');
const INCLUDE = [
  path.resolve(__dirname, 'node_modules/@bcgsc'),
  SRC_PATH,
];


const moduleSettings = {
  rules: [
    {
      test: /\.css$/,
      sideEffects: true,
      include: [SRC_PATH],
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
      ],
    },
    {
      test: /\.scss$/,
      sideEffects: true,
      include: [SRC_PATH],
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader',
      ],
    },
    {
      test: /\.js$/,
      include: INCLUDE,
      use: ['babel-loader'],
    },
    {
      // convert images to embeded hashes
      test: /\.(bmp|gif|jpeg?|png)$/,
      loader: 'url-loader',
      include: INCLUDE,
      options: {
        limit: 10000,
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
    {
      test: /\.html$/,
      loader: 'html-loader',
    },
    {
      // Load everything else
      test: /\.(md|svg|ico|json)$/,
      include: INCLUDE,
      loader: 'file-loader',
      options: {
        name: 'static/[name].[ext]',
      },
    },
  ],
};

module.exports = {
  context: SRC_PATH,
  entry: [
    'abortcontroller-polyfill',
    './../config/polyfills.js',
    './index.js',
  ],
  output: {
    path: DIST_PATH,
    filename: 'bundle.js',
    publicPath: '/',
  },
  devServer: {
    host: '0.0.0.0',
    port: 3000,
    disableHostCheck: true,
    hot: true,
    publicPath: '/',
    historyApiFallback: true,

  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    // separate the css from the main js bundle
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CleanWebpackPlugin(
      DIST_PATH,
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
      PASSWORD: null,
      npm_package_version: null,
    }),
    // template index.html. Required for running the dev-server properly
    new HtmlWebpackPlugin({
      template: path.resolve(SRC_PATH, 'static/index.html'),
      filename: './index.html',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: moduleSettings,
};
