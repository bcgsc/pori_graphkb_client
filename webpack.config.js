const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // eslint ignore-line
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');


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
      use: [
        'babel-loader',
        'eslint-loader',
      ],
      sideEffects: false,
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


const plugins = [
  new webpack.HotModuleReplacementPlugin(),
  // separate the css from the main js bundle
  new MiniCssExtractPlugin({
    filename: 'static/style/[name].css',
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
    KEYCLOAK_REALM: 'GSC',
    KEYCLOAK_ROLE: 'GraphKB',
    KEYCLOAK_URL: 'https://sso.bcgsc.ca/auth',
    NODE_ENV: 'production',
    USER: null,
    PASSWORD: null,
    npm_package_version: null,
  }),
  // template index.html. Required for running the dev-server properly
  new HtmlWebpackPlugin({
    template: path.resolve(SRC_PATH, 'static/index.html'),
    filename: 'index.html',
    inject: true,
  }),
  new CompressionPlugin({
    test: /.*\.(js|css)$/,
    minRatio: 0.8,
  }),
  /** dd assests manifest */
  new ManifestPlugin({
    fileName: 'manifest.json',
  }),
  /* From eject react app (Old webpack eject)
   * This service worker is required to ensure that the URL refresh works with a static
   * server (If previously visited)
   * Generate a service worker script that will precache, and keep up to date,
   * the HTML & assets that are part of the Webpack build.
   */
  new SWPrecacheWebpackPlugin({
    // By default, a cache-busting query parameter is appended to requests
    // used to populate the caches, to ensure the responses are fresh.
    // If a URL is already hashed by Webpack, then there is no concern
    // about it being stale, and the cache-busting can be skipped.
    dontCacheBustUrlsMatching: /\.\w{8}\./,
    filename: 'service-worker.js',
    logger(message) {
      if (message.indexOf('Total precache size is') === 0) {
        // This message occurs for every build and is a bit too noisy.
        return;
      }
      if (message.indexOf('Skipping static resource') === 0) {
        // This message obscures real errors so we ignore it.
        // https://github.com/facebookincubator/create-react-app/issues/2612
        return;
      }
      console.log(message);
    },
    minify: true,
    // For unknown URLs, fallback to the index page
    navigateFallback: '/index.html',
    // Ignores URLs starting from /__ (useful for Firebase):
    // https://github.com/facebookincubator/create-react-app/issues/2237#issuecomment-302693219
    navigateFallbackWhitelist: [/^(?!\/__).*/],
    // Don't precache sourcemaps (they're large) and build asset manifest:
    staticFileGlobsIgnorePatterns: [/\.map$/, /asset-manifest\.json$/],
  }),
];


module.exports = {
  context: SRC_PATH,
  entry: [
    './polyfills.js',
    './index.js',
  ],
  output: {
    path: DIST_PATH,
    filename: 'static/js/[name].bundle.js',
    chunkFilename: 'static/js/[name].bundle.js',
    publicPath: '/',
  },
  devServer: {
    host: '0.0.0.0',
    port: 3000,
    disableHostCheck: true,
    hot: true,
    publicPath: '/',
    historyApiFallback: true,
    compress: true,
  },
  performance: { hints: 'warning' },
  // production optimizations
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          reuseExistingChunk: true,
        },
      },
    },
  },
  plugins,
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: moduleSettings,
};