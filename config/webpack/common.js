/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // eslint ignore-line
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');


const stripToBaseUrl = (url) => {
  const match = /^(https?:\/\/[^/]+)/.exec(url);
  const baseAuthUrl = match
    ? match[1]
    : url;
  return baseAuthUrl;
};


const createBaseConfig = ({
  env = {}, mode = 'production', sourceMap = false, outputPath,
} = {}) => {
  const BASE_DIR = path.resolve(__dirname, '../..');
  const SRC_PATH = path.resolve(BASE_DIR, 'src');
  const INCLUDE = [
    path.resolve(BASE_DIR, 'node_modules/@bcgsc'),
    SRC_PATH,
  ];

  const ENV_VARS = {
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'GraphKB',
    KEYCLOAK_ROLE: process.env.KEYCLOAK_ROLE || 'GraphKB',
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'PORI',
    KEYCLOAK_URL: process.env.KEYCLOAK_URL || 'http://localhost:8888/auth',
    API_BASE_URL: process.env.API_BASE_URL ||  'http://localhost:8080/api',
    CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'graphkb@bcgsc.ca',
    CONTACT_TICKET_URL: process.env.CONTACT_TICKET_URL || 'https://www.bcgsc.ca/jira/projects/KBDEV',
    ...env
  };


  const moduleSettings = {
    rules: [
      {
        test: /\.css$/,
        sideEffects: true,
        include: [
          SRC_PATH,
          path.resolve(BASE_DIR, 'node_modules/ag-grid-community/dist/styles'),
        ],
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
        test: /\.(bmp|gif|jpeg?|png|ico)$/,
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
        options: {
          removeComments: false,
        },
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
      outputPath, { root: BASE_DIR },
    ),
    // Copy values of ENV variables in as strings using these defaults (null = unset)
    new webpack.DefinePlugin({
      'window._env_': JSON.stringify(ENV_VARS),
      'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version),
      'process.NODE_ENV': JSON.stringify(env.NODE_ENV || process.env.NODE_ENV)
    }),
    // template index.html. Required for running the dev-server properly
    new HtmlWebpackPlugin({
      template: path.resolve(SRC_PATH, 'static/index.html'),
      filename: 'index.html',
      inject: true,
      favicon: path.resolve(SRC_PATH, 'static/favicon/favicon.ico'),
      minify: {
        removeComments: false,
      },
    }),
    new CspHtmlWebpackPlugin({
      'base-uri': "'self'",
      'default-src': "'self'",
      'object-src': "'none'",
      'img-src': ["'self'", 'data:', '*'],
      'frame-src': [
        "'self'",
        '*',
        'https://www.ncbi.nlm.nih.gov',
      ],
      'connect-src': [
        "'self'",
        '*'
      ],
      // TODO: Remove google charts requirement since it requires external load which cannot include nonce/hash
      // Then re-add the nonce/hash to scripts
      // https://www.gstatic.com is for google charts API
      'script-src': [
        'https://www.gstatic.com',
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
      ],
      'style-src': [
        'https://www.gstatic.com',
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
      ],
      'font-src': ["'self'", 'data:'],
    }, {
      enabled: true,
      hashEnabled: {
        'style-src': false,
        'script-src': false,
      },
      nonceEnabled: {
        'style-src': false,
        'script-src': false,
      },
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
        console.log(message);  // eslint-disable-line
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


  return {
    mode,
    context: SRC_PATH,
    entry: [
      './polyfills.js',
      './index.js',
    ],
    output: {
      path: outputPath,
      filename: 'static/js/[name].bundle.js',
      chunkFilename: 'static/js/[name].[chunkhash].chunk.js',
      publicPath: '/',
    },
    devServer: {
      host: process.env.HOSTNAME || 'localhost',
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
      minimizer: [
        new TerserWebpackPlugin({
          terserOptions: {
            keep_classnames: true,
            module: true,
            sourceMap,
          },
        }),
      ],
    },
    plugins,
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': SRC_PATH,
      },
    },
    module: moduleSettings,

  };
};

module.exports = createBaseConfig;
